# roon-web-stack

[![CI](https://github.com/nihilux-org/roon-web-stack/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nihilux-org/roon-web-stack/actions/workflows/ci.yml)
[![CD](https://github.com/nihilux-org/roon-web-stack/actions/workflows/cd.yml/badge.svg)](https://github.com/nihilux-org/roon-web-stack/actions/workflows/cd.yml)

An ensemble of tools to drive `roon`, from a web browser.

<img style="max-width: 800px;" alt="Application first launch, without extension being enabled in roon settings" src="./doc/images/main-screen.png">

The final produced artifact is a [`docker` image](https://hub.docker.com/repository/docker/nihiluxorg/roon-web-stack/general) containing a `node` application serving both an `Angular` app and a `node` [CQRS](https://martinfowler.com/bliki/CQRS.html) http proxy fronting the [node roon api](https://github.com/RoonLabs/node-roon-api).

## How to use it

### Using roon-extension-manager

Thanks to [The Appgineer](https://github.com/TheAppgineer), this app is available in [roon extension manager](https://github.com/TheAppgineer/roon-extension-manager/wiki) starting with version `1.0.16` of the repository:

<img style="width: 600px;" alt="roon-extension-manager settings" src="./doc/images/roon-extension-manager.png">

This is the easiest way to use it.  
You can find more info about this tool [on roon forum](https://community.roonlabs.com/t/roon-extension-manager-1-x-currently-at-v1-1-2/161624) or [in its GitHub project](https://github.com/TheAppgineer/roon-extension-manager/wiki).  
Once again, big thanks to [The Appgineer](https://github.com/TheAppgineer), both for the [roon extension manager](https://github.com/TheAppgineer/roon-extension-manager/wiki) and for the integration in the repository.

### Using docker

How to use the `docker` image [available on `docker hub`](https://hub.docker.com/repository/docker/nihiluxorg/roon-web-stack/general):  
```bash
docker run \
-d \
--network host \
--name roon-web-stack \
-e PORT=8282 \
-e LOG_LEVEL=info
-v {somewhere_on_your_host}/config:/usr/src/app/config
nihiluxorg/roon-web-stack
```
- The `network host` setting is needed to enable autodiscovery of your `roon` server.  
It should be possible to make this requirement optional by providing explicit information about the `roon` server to connect with.  
This will be explored later, so for now, this is mandatory.   
- You can configure the `port` used by `node` with the `-e PORT={port_number}` env variable definition.  
If you don't specify a `port`, the `node` default, `3000` will be used.
- You can configure the `log` level used by the `node` app via the `-e LOG_LEVEL={level}` env variable definition.  
Supported values are one of `trace|debug|info|warn|error`.  
If you don't set this variable, `info` will be used. 
- The volume mounted by `-v {somewhere_on_your_host}/config:/usr/src/app/config` is here to save the `config.json` file used by the `roon` extension.  
The corresponding `path` is declared as a `volume` in the [Dockerfile](./app/roon-web-api/Dockerfile) and a `symlink` is present to make the `config.json` file accessible to the `node` app.  
This directory must be readable and writable by the user inside the `docker`.

**disclaimer:**  
*There's a bug somewhere between `node lts-alpine` images, `qemu`, `buildx` and `github actions` that breaks them for `armv7` (32 bits `ARM`, like Raspberry Pi 2 and older).  
I want neither to add a dedicated pipeline for this architecture as a workaround, nor I want to use `debian` as base image, because it's hundred of `MB` larger.  
Waiting for this bug to be resolved, this platform is not supported (see [this issue](https://github.com/nodejs/docker-node/issues/1798) and this [repo that reproduces this bug](https://github.com/felddy/npm-hang-test)).*

### Using docker-compose

Another way to ease all that has been described above is to go with `docker-compose` (or any equivalent solution to lightly orchestrate containers).  
Here is an exemple of a `docker-compose.yaml` (that I use on `dietpi` to run this app at home):

```yaml
version: '3.8'
services:
  roon-web-stack:
    image: nihiluxorg/roon-web-stack
    container_name: roon-web-stack
    network_mode: host
    volumes:
      - config:/usr/src/app/config
    environment:
      - "PORT=8282"
      - "LOG_LEVEL=info"
volumes:
  config:
```

In this exemple, the `config` volume is created and reused by `docker-compose` without any need to map it to your `host` filesystem.

Once again, there are many ways to achieve this kind of configuration. These exemples are just here to provide indication on what's needed for this [`docker` image](https://hub.docker.com/repository/docker/nihiluxorg/roon-web-stack/general) to work.

### In the browser

Once the container has started, just go to `http://{host}:{port}` with any **modern** browser.  
You should be welcome by the application.  
On first launch, you'll be asked to choose a `zone` to display.  
Choose one, and voilà:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./doc/images/selecting-zone-at-first-launch.gif">

After this first boot, the app will display the last displayed `zone`.

You can change the displayed `zone` with the `zone` selector on the app main screen and via the `settings`:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./doc/images/zone-selection-and-settings.gif">

`Settings` are kind of minimal for now:
- you can choose the theme used
- you can choose between two display modes
- you can select the displayed zone

As features will be added, settings will be added, if needed, to support them.  
These settings are saved in `localstorage`, so they're both linked to the `host` serving the app and to the browser instance they've been set. Changing one of these parameters will reset all settings to their default value.

Using the app should be pretty straight-forward for anyone using `roon`, still, there's a [user guide (with a FAQ) available](./doc/user-guide.md).

### Enabling the extension in roon settings

Don't forget to enable the extension in `roon` settings (might be needed every time you recreate or restart the container if you don't mount the `config` volume).  
If you don't, you'll see this message in the browser:

<img style="max-width: 800px;" alt="Application first launch, without extension being enabled in roon settings" src="./doc/images/first-launch-without-extension-enabled.png">

As a reminder, this is how to enable an extension in `roon` settings:

<img style="max-width: 800px;" alt="Application first launch, without extension being enabled in roon settings" src="./doc/images/enable-in-roon-extension-settings.png">

## How to build it from source

First, you'll need the last `lts` version of `node` (newer might work, not tested though). Currently, the [CI](./.github/workflows/ci.yml) and the [CD](./.github/workflows/cd.yml) are using what's defined in the main `package.json`: `node >= 20.12.0`. This will follow availability of node `lts` in `github` actions.
How you install `node` is your story, after all you want to build from sources.

Checkout the code and `cd` in the directory.

This `monorepo` uses `yarn 4.2.1` as it's package manager as defined in the root `package.json`.

To enable `corepack` for this project, you'll be good for a pair of:
```bash
corepack install
corepack enable yarn
```

Then install, build (just to check everything works fine), have fun:
```bash
yarn install
yarn build
```
To launch the `backend` in watch mode:
```bash
yarn backend
```
To launch the `frontend` in watch mode:
```bash
yarn frontend
```
Most commands are available at `root` of the `monorepo`:
```bash
yarn lint       #lint every workspace in their dependency order
yarn lint:fix   #lint and auto-fix every workspace in their dependency order
yarn build      #build every workspace in their dependency order, run lint during build process
yarn test       #test every workspace in their dependency order
```

The angular dev server is configured to proxy calls to the api on the `node` default port, so everything should be ready for you to `code`.

If you want to build locally the `docker` image, you'll have to manually copy the built `Angular` app in the build folder of the `api`, then run `docker build`:
```bash
yarn build
cp -r ./app/roon-web-ng-client/dist/roon-web-ng-client/browser ./app/roon-web-api/bin/web
docker build -t nihiluxorg/roon-web-stack:latest -f app/roon-web-api/Dockerfile .
```
Then you can use the `docker` command already mentioned to launch your freshly built image.

## Some context

This project is young and at its very early stage. It's just enough functionalities to be usable and I value the feedback from the community. The idea is to feed further development by these feedbacks.

Also, despite building software for a living, I'm not a `frontend` developer.
My core experiences and expertises are in designing and building distributed and scalable `apis` (`µ-services`, `cloud stuff`, `k8s`, `dbs` and all the usual suspects).   
Recently I've only used `typescript`, at work, to build `serverless` and `@edge` stuffs.

This project was for me an occasion to go back to `web` development (I'd not done that for at least 7 years), helping to deal with some personal stuff in the process.

So, development will be agile, on my personal time. I'm not planning spending more than 3 to 5 hours a week on this project in the future. Otherwise, it should become my job.  
See [what's coming for this project](./doc/what-s-coming.md) to learn how to submit feature request and how to participate in the priorisation process.

Any contribution is welcome, see [CONTRIBUTING](./CONTRIBUTING.md) for info.  

**Constructive** remarks on the [stack choices](./doc/stack-choices.md) or better way to code a modern `Angular` app are also welcome (last project I've worked on as a `fullstack` dev was almost a decade ago, during the early days of `Angular 2`).

## Thanks [Stevenic](https://github.com/Stevenic) for [roon-kit](https://github.com/Stevenic/roon-kit)!

**This `monorepo` includes inlined sources coming from [Stevenic/roon-kit](https://github.com/Stevenic/roon-kit).**

It's stated everywhere it makes sens, and this is one of these places.

See the [README.md](app/roon-web-api/src/roon-kit/README.md) in the corresponding source folder for more details (and here for the [model part](packages/roon-web-model/src/roon-kit/README.md)).

## Credits

This app would not have been possible without the vitality of open source projects, so thanks to all of them.

Sorry if I forgot anyone, please don't argue on the order.

- [Stevenic](https://github.com/Stevenic) for [roon-kit](https://github.com/Stevenic/roon-kit)
- [roon](https://roon.app) for [node roon api](https://github.com/RoonLabs/node-roon-api)
- [Angular](https://github.com/angular)
- [Angular Material](https://github.com/angular/components)
- [Fastify](https://github.com/fastify/fastify)
- [Fastify SSE v2](https://github.com/mpetrunic/fastify-sse-v2)
- [Fastify static](https://github.com/fastify/fastify-static)
- [graceful server](https://github.com/gquittet/graceful-server)
- [nanoid](https://github.com/ai/nanoid)
- [ts-retry-promise](https://github.com/normartin/ts-retry-promise)
- [fast-equals](https://github.com/planttheidea/fast-equals)
- [rxjs](https://github.com/ReactiveX/rxjs)
- [jest](https://github.com/jestjs/jest)
- [node](https://github.com/nodejs/node)
- [typescript](https://github.com/microsoft/TypeScript)
- [yarn](https://github.com/yarnpkg/berry)
- [Sass](https://github.com/sass/sass)
- [webpack](https://github.com/webpack/webpack) (can't list every plugin used, but thanks to everyone!)
- [eslint](https://github.com/eslint/eslint) (can't list everything's used, but thanks to everyone!)
- [prettier](https://github.com/prettier/prettier)
- [editorconfig](https://github.com/editorconfig/editorconfig)
- [docker](https://github.com/docker)
- [GitHub](https://github.com), with a special thanks to everyone involved in the `actions` in used in this repo
- [alpine](https://gitlab.alpinelinux.org/alpine/aports)
- [linux and git](https://git.kernel.org)
