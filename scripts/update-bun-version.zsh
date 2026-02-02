#!/usr/bin/env zsh

autoload colors;
colors;

usage="update-bun-version <version>";

zmodload zsh/zutil;
zparseopts -D -F -K -- \
  {h,-help}=flag_help || {
    print "${usage}" && exit 1;
  };

if (( $#flag_help )); then
  print "${usage}";
  exit 0;
fi

VERSION="$1";

if [[ -z "${VERSION}" ]]; then
  printf "%s%s%s\n" "${fg_bold[red]}" "Error: Version parameter required" "${reset_color}";
  print "${usage}";
  exit 1;
fi

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  printf "%s%s%s\n" "${fg_bold[red]}" "Error: Invalid version format. Expected X.Y.Z format" "${reset_color}";
  exit 1;
fi

script_source=$(readlink -f "${0%/*}")
cd "${script_source}/.." || exit;

printf "%s%-55s%s\n" "${fg_bold[green]}" "checking current bun version compatibility..." "${reset_color}";
CURRENT_BUN_VERSION=$(bun -v);

IFS='.' read -r CURRENT_MAJOR CURRENT_MINOR CURRENT_PATCH <<< "${CURRENT_BUN_VERSION}"
IFS='.' read -r REQUESTED_MAJOR REQUESTED_MINOR REQUESTED_PATCH <<< "${VERSION}"

if (( CURRENT_MAJOR < REQUESTED_MAJOR )); then
  printf "%s%s %s < %s%s\n" "${fg_bold[red]}" "Error: Current bun version" "${CURRENT_BUN_VERSION}" "${VERSION}" "${reset_color}";
  exit 1;
elif (( CURRENT_MAJOR == REQUESTED_MAJOR )) && (( CURRENT_MINOR < REQUESTED_MINOR )); then
  printf "%s%s %s < %s%s\n" "${fg_bold[red]}" "Error: Current bun version" "${CURRENT_BUN_VERSION}" "${VERSION}" "${reset_color}";
  exit 1;
elif (( CURRENT_MAJOR == REQUESTED_MAJOR )) && (( CURRENT_MINOR == REQUESTED_MINOR )) && (( CURRENT_PATCH < REQUESTED_PATCH )); then
  printf "%s%s %s < %s%s\n" "${fg_bold[red]}" "Error: Current bun version" "${CURRENT_BUN_VERSION}" "${VERSION}" "${reset_color}";
  exit 1;
fi

printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "current bun version" "${CURRENT_BUN_VERSION}" "${reset_color}" "✅ ";
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "requested version" "${VERSION}" "${reset_color}" "✅ ";
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "version compatibility check" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "updating root package.json engines.bun..." "${reset_color}";
jq --arg v ">= ${VERSION}" '.engines.bun = $v' package.json > package.json.tmp && mv package.json.tmp package.json
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "root/package.json" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "updating @types/bun in app/roon-web-api/package.json..." "${reset_color}";
jq --arg v "${VERSION}" '.devDependencies["@types/bun"] = $v' app/roon-web-api/package.json > app/roon-web-api/package.json.tmp && mv app/roon-web-api/package.json.tmp app/roon-web-api/package.json
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "app/roon-web-api/package.json" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "updating @types/bun in packages/roon-web-client/package.json..." "${reset_color}";
jq --arg v "${VERSION}" '.devDependencies["@types/bun"] = $v' packages/roon-web-client/package.json > packages/roon-web-client/package.json.tmp && mv packages/roon-web-client/package.json.tmp packages/roon-web-client/package.json
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "packages/roon-web-client/package.json" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "updating @types/bun in app/roon-web-ng-client/package.json..." "${reset_color}";
jq --arg v "${VERSION}" '.devDependencies["@types/bun"] = $v' app/roon-web-ng-client/package.json > app/roon-web-ng-client/package.json.tmp && mv app/roon-web-ng-client/package.json.tmp app/roon-web-ng-client/package.json
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "app/roon-web-ng-client/package.json" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "updating Dockerfile BUN_VERSION..." "${reset_color}";
sed -i '' "s/^ARG BUN_VERSION=.*/ARG BUN_VERSION=${VERSION}/" app/roon-web-api/Dockerfile
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "app/roon-web-api/Dockerfile" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "updating GitHub Actions workflow bun-version..." "${reset_color}";
sed -i '' "s/bun-version: .*/bun-version: ${VERSION}/" .github/workflows/ci.yml
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" ".github/workflows/ci.yml" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "running bun install..." "${reset_color}";
bun install
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "bun install completed" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "running bun run ci..." "${reset_color}";
bun run ci
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "bun run ci completed" "${reset_color}" "✅ ";

printf "%s%-55s%s%s\n" "${fg_bold[green]}" "all done!" "${reset_color}" "📦 => 🚀 => ✅ ";
