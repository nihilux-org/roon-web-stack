#!/usr/bin/env bun
import { $ } from "bun";
import { dirname } from "path";

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

const doBuild = async (baseDirectory: string) => {
  const build = await Bun.build({
    entrypoints: [`${baseDirectory}/src/index.ts`],
    minify: true,
    sourcemap: true,
    outdir: `${baseDirectory}/${outdir}`,
    target: "bun",
    naming: "[dir]/roon-web-client.[ext]",
  });
  if (!build.success) {
    logError("build failed");
    for (const log of build.logs) {
      logError(log.message);
    }
    process.exit(1);
  }

  log(`build done, ${build.outputs.length} file(s) generated:`);
  for (const file of build.outputs) {
    log(`file ${file.path}: ${Math.ceil(file.size / 1024)} KB`);
  }

  const declarationProcess = Bun.spawn(["tsc", "--emitDeclarationOnly", "--project", "tsconfig.types.json"], {
    cwd: baseDirectory,
  });
  await declarationProcess.exited;
};

const main = async (target: string) => {
  try {
    const roonWebApiBaseDirectory = dirname(dirname(import.meta.url.replace("file://", "")));
    switch (target) {
      case "clean":
        await clean(roonWebApiBaseDirectory);
        break;
      case "build":
        await clean(roonWebApiBaseDirectory);
        await doBuild(roonWebApiBaseDirectory);
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
