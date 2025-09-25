#!/usr/bin/env zsh

autoload colors;
colors;

usage="version-manager [-b|--beta <create a new beta>] [-r|--release <create a new release>]";

zmodload zsh/zutil;
zparseopts -D -F -K -- \
  {h,-help}=flag_help \
  {b,-beta}=flag_beta \
  {r,-release}=flag_release || {
    print "${usage}" && exit 1;
  };

if (( $#flag_help )); then
  print "${usage}";
  exit 0;
fi

root_directory=${0:a:h:h}

cd "${root_directory}" || exit

packages_json=(
  "${root_directory}"/package.json
  "${root_directory}"/app/roon-web-api/package.json
  "${root_directory}"/app/roon-web-ng-client/package.json
  "${root_directory}"/packages/roon-web-client/package.json
  "${root_directory}"/packages/roon-web-eslint/package.json
  "${root_directory}"/packages/roon-web-model/package.json
)

infrastructure_file="${root_directory}"/app/roon-web-api/src/infrastructure/roon-extension.ts
infrastructure_version=$(cat $infrastructure_file | grep -e "export const extension_version")
infrastructure_version=${infrastructure_version#*\"}
infrastructure_version=${infrastructure_version%\"*}

printf "%s%-55s%s\n" "${fg_bold[green]}" "current version in package.json files:" "${reset_color}";

for package in $packages_json; do
  package_version=$(jq -r .version "${package}")
  printf "%s%-55s%s\n" "${fg[blue]}" "${package} current version: ${package_version}" "${reset_color}"
done

printf "%s%-55s%s\n" "${fg_bold[green]}" "current version in api infrastructure:" "${reset_color}";
printf "%s%-55s%s\n" "${fg[blue]}" "${infrastructure_version}" "${reset_color}"

if (( $#flag_beta && $#flag_release )); then
  printf "%s%-55s%s\n" "${fg[red]}" "both beta and release flags, this is invalid" "${reset_color}"
  print "${usage}"
  exit 0;
elif (( !$#flag_beta && !$#flag_release )); then
  printf "%s%-55s%s\n" "${fg_bold[green]}" "no flag passed, all done." "${reset_color}"
  exit 0;
elif (( $#flag_beta )); then
  printf "%s%-55s%s\n" "${fg_bold[green]}" "preparing a new beta version:" "${reset_color}"
  if [[ $infrastructure_version = *"-beta-"* ]]; then
    beta_number=${infrastructure_version##*beta-}
    new_beta=$(( beta_number + 1 ))
    new_infrastructure_version=${infrastructure_version//beta-[0-9]*/beta-${new_beta}}
    printf "%s%-55s%s\n" "${fg[blue]}" "bumping beta version from ${beta_number} => ${new_beta} in file ${infrastructure_file}" "${reset_color}"
    sed -i.bak 's/const extension_version = ".*"/const extension_version = "'"${new_infrastructure_version}"'"/' "$infrastructure_file" && rm -f "$infrastructure_file".bak
  else
    IFS='.' read -r major_version minor_version patch_version <<< "$infrastructure_version"
    new_patch_version=$(( patch_version + 1 ))
    new_version="${major_version}.${minor_version}.${new_patch_version}"
    printf "%s%-55s%s\n" "${fg[blue]}" "on release version ${infrastructure_version}, setting version ${new_version} in every package.json file and setting ${new_version}-beta-1 in ${infrastructure_file}" "${reset_color}"
    for package in $packages_json; do
      sed -i.bak 's/"version": ".*"/"version": "'"${new_version}"'"/' "$package" && rm -f "$package".bak
    done
    sed -i.bak 's/const extension_version = ".*"/const extension_version = "'"${new_version}"'-beta-1"/' "$infrastructure_file" && rm -f "$infrastructure_file".bak
  fi
elif (( $#flag_release )); then
  printf "%s%-55s%s\n" "${fg_bold[green]}" "preparing a new release version:" "${reset_color}"
  if [[ $infrastructure_version = *"-beta-"* ]]; then
    non_beta_version=${infrastructure_version%-beta-*}
    printf "%s%-55s%s\n" "${fg[blue]}" "currently on a beta train, simply stripping the beta part ${infrastructure_version} => ${non_beta_version} in file ${infrastructure_file}" "${reset_color}"
    sed -i.bak 's/const extension_version = ".*"/const extension_version = "'"${non_beta_version}"'"/' "$infrastructure_file" && rm -f "$infrastructure_file".bak
  else
    IFS='.' read -r major_version minor_version patch_version <<< "$infrastructure_version"
    new_patch_version=$(( patch_version + 1 ))
    new_version="${major_version}.${minor_version}.${new_patch_version}"
    printf "%s%-55s%s\n" "${fg[blue]}" "currently on a release ${infrastructure_version}, setting version ${new_version} in every package.json file and in file ${infrastructure_file}" "${reset_color}"
    for package in $packages_json; do
      sed -i.bak 's/"version": ".*"/"version": "'"${new_version}"'"/' "$package" && rm -f "$package".bak
    done
    sed -i.bak 's/const extension_version = ".*"/const extension_version = "'"${new_version}"'"/' "$infrastructure_file" && rm -f "$infrastructure_file".bak
  fi
fi
