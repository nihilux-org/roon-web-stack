#!/usr/bin/env zsh

autoload colors;
colors;

repo="nihiluxorg";
app="roon-web-stack";
tag="beta";
platforms="linux/arm64";
builder="multiplatform-builder";

usage="local-release [-r|--repo <docker repo name>] [-a|--app <docker app name>] [-t|--tag <docker tag>] [-p|--platforms <docker arch>] [-b|--builder <docker buildx builder>] [-l|--local <flag to not push built image(s) to Docker Hub>]";

zmodload zsh/zutil;
zparseopts -D -F -K -- \
  {h,-help}=flag_help \
  {l,-local}=flag_not_push \
  {r,-repo}:=repo_arg \
  {a,-app}:=app_arg \
  {t,-tag}:=tag_arg \
  {p,-platforms}:=platforms_arg \
  {b,-builder}:=builder_arg || {
    print "${usage}" && exit 1;
  };

if (( $#flag_help )); then
  print "${usage}";
  exit 0;
fi

if [[ -n $repo_arg ]]; then
  repo="${repo_arg[2]}";
fi

if [[ -n $app_arg ]]; then
  app="${app_arg[2]}";
fi

if [[ -n $tag_arg ]]; then
  tag="${tag_arg[2]}";
fi

if [[ -n $platforms_arg ]]; then
  platforms="${platforms_arg[2]}";
fi

if [[ -n $builder_arg ]]; then
  builder="${builder_arg[2]}";
fi

script_source=$(readlink -f "${0%/*}")
cd "${script_source}/.." || exit;

printf "%s%-55s%s\n" "${fg_bold[green]}" "building the js bundles:" "${reset_color}";
yarn cd;
printf "%s%-55s%s" "${fg_bold[green]}" "js bundles built: " "${reset_color}";
printf "%s\n" "📦 => ✅ ";

printf "%s%-55s%s" "${fg_bold[green]}" "moving Angular app to 'backend' bin folder:" "${reset_color}";
cp -r ./app/roon-web-ng-client/dist/roon-web-ng-client/browser ./app/roon-web-api/bin/web;
printf "%s\n" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "setting buildx builder to:" "${reset_color}";
docker buildx use "${builder}";
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "${builder}" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "docker image repo, name and tag will be:" "${reset_color}";
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "${repo}/${app}:${tag}" "${reset_color}" "✅ ";

printf "%s%-55s%s\n" "${fg_bold[green]}" "image will be built for platforms:" "${reset_color}";
printf "%s%-55s%s%s\n" "${fg_bold[blue]}" "${platforms}" "${reset_color}" "✅ ";

DOCKER_BUILD_COMMAND="docker buildx build \
  -t ${repo}/${app}:${tag} \
  -f app/roon-web-api/Dockerfile \
  --platform ${platforms}";

if (( $#flag_not_push )); then
  printf "%s%-55s%s" "${fg_bold[green]}" "built image(s) won't be pushed to Docker Hub:" "${reset_color}";
  printf "%s\n" "📦 => 🐳 => 💻 ";
else
  printf "%s%-55s%s" "${fg_bold[green]}" "built image(s) will be pushed to Docker Hub:" "${reset_color}";
  DOCKER_BUILD_COMMAND="${DOCKER_BUILD_COMMAND} --push";
  printf "%s\n" "📦 => 🐳 => ☁️ ";
fi

DOCKER_BUILD_COMMAND="${DOCKER_BUILD_COMMAND} ."

printf "%s%-55s%s\n" "${fg_bold[green]}" "running the docker buildx build command:" "${reset_color}";
eval "${DOCKER_BUILD_COMMAND}";

printf "%s%-55s%s%s\n" "${fg_bold[green]}" "all done!" "${reset_color}" "📦 => 🐳 => 🚀 => ✌️ ";
