#!/usr/bin/env bun
import { $, BuildConfig } from "bun";
import { dirname } from "path";
import { chdir } from "process";

const EXTERNALS = [
  "node-roon-api-audioinput",
  "node-roon-api-browse",
  "node-roon-api-image",
  "node-roon-api-settings",
  "node-roon-api-status",
  "node-roon-api-transport",
];

const outdir = "bin";

const log = (message: string, level = "info", arg?: unknown) => {
  const toLog: unknown[] = [message];
  if (arg !== undefined) {
    toLog.push(arg);
  }
  switch (level) {
    case "error":
      // eslint-disable-next-line no-console
      console.error(...toLog);
      break;
    case "info":
      // eslint-disable-next-line no-console
      console.log(...toLog);
      break;
    default:
      // eslint-disable-next-line no-console
      console.debug(...toLog);
      break;
  }
};

const logError = (message: string, arg?: unknown) => {
  log(message, "error", arg);
};

const clean = async (baseDirectory: string) => {
  try {
    await $`rm -rf ${baseDirectory}/${outdir}`;
    log("cleaned");
  } catch (e) {
    if (e instanceof $.ShellError) {
      logError(e.text());
      process.exit(e.exitCode);
    }
  }
};

const cdBin = async (baseDirectory: string) => {
  const binDir = `${baseDirectory}/${outdir}`;
  await $`mkdir ${binDir}`;
  chdir(binDir);
};

const doBuild = async (target: string, baseDirectory: string, config: Partial<BuildConfig>) => {
  const buildConfig = {
    entrypoints: [`${baseDirectory}/src/index.ts`],
    minify: true,
    sourcemap: true,
    external: EXTERNALS,
    ...config,
  };
  const build = await Bun.build(buildConfig);
  if (!build.success) {
    logError("build failed");
    for (const log of build.logs) {
      logError(log.message);
    }
    process.exit(1);
  }

  log(`build ${target} done, ${build.outputs.length} file(s) generated:`);
  for (const file of build.outputs) {
    log(`file ${file.path}: ${Math.ceil(file.size / 1024)} KB`);
  }

  await $`mkdir ${baseDirectory}/${outdir}/node_modules`;
  for (const external of EXTERNALS) {
    await $`cp -rL ${baseDirectory}/node_modules/${external} ${baseDirectory}/${outdir}/node_modules/`;
    log(`with external lib ${baseDirectory}/${outdir}/node_modules/${external}`);
  }
};

const main = async (target: string) => {
  try {
    const roonWebApiBaseDirectory = dirname(dirname(import.meta.url.replace("file://", "")));
    const outdirFullPath = `${roonWebApiBaseDirectory}/${outdir}`;
    switch (target) {
      case "clean":
        await clean(roonWebApiBaseDirectory);
        break;
      case "binary":
        await clean(roonWebApiBaseDirectory);
        await cdBin(roonWebApiBaseDirectory);
        await doBuild(target, roonWebApiBaseDirectory, {
          compile: {
            outfile: `${outdirFullPath}/roon-web-api`,
            autoloadPackageJson: true,
          },
        });
        break;
      case "debug":
        await clean(roonWebApiBaseDirectory);
        await cdBin(roonWebApiBaseDirectory);
        await doBuild(target, roonWebApiBaseDirectory, {
          outdir: outdirFullPath,
          target: "bun",
          naming: "[dir]/roon-web-api.[ext]",
        });
        break;
      default:
        log(`Usage: bun run build.ts <target>
Targets:
  build       Production build (single executable)
  build:debug Debug build (bin/ with sourcemaps)
  clean       Remove bin/ directory`);
        process.exit(0);
    }
  } catch (err) {
    logError("oups...🤷...", err);
    process.exit(1);
  }
};

void main(process.argv[2] ?? "help");
