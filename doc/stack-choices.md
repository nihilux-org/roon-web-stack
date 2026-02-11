# Stack choices

Some thoughts on the `stack` and `architecture` choice:
- for the [frontend](#frontend-app)
- for the [backend](#backend-api-proxy)

## Frontend app

### Why Angular?
 As stated in the [README](../README.md), I've not been directly involved in `frontend` development recently.  
 I've fixed some bugs on `react` enterprise app, to help teams I was working with as a `backend` engineer.  
 Nothing more in the last 7 years.  
 
When I've decided to start coding a `roon` web client, I first looked at the `react` world. 
After all, even if it was not brand new, it still looked like the cool kid of the gang. 
Then I started reading about the state of the art of `react` development, started to read `Next.js` doc... and gave up 🤷.  
There was nothing here I didn't understand (both regarding *the why* and *the how*), but the extra complexity brought nothing to my actual use case.

At this point, I also had already lost way too much time (from my point of view) on issues with tooling while setting up the `API` part of this repo.   
Simplifying the stack was a very welcome thing.  
That was fun (or not?) to build a `monorepo` in `typescript`.   
Any `frontend` tech lead would certainly laugh at the result, but it was part of the game: starting form scratch with these technologies out of my core expertise.   

All these little frustrations made the hype stuffs looked less attractive: 

*give me something that works, which includes tooling, a stable component library, and that won't be abandoned for the next new thing in the 6 coming months.*  

If the project finds its audience, I don't want to get stuck in a technological dead end implying a full rewrite in two years.

So despite my initial curiosity for the vast diversity of the web development universe, I've had a look at the release notes of the `Angular 17` version that were still hot, just baked (all that project started in the first days of december 2023).  
And what I read made a lot of sens:
- `Signals` are a nice way to deal with change propagation (especially `computed` ones) 
- The new `control flow` syntaxes are nice and clean
- `Angular Material` has almost everything I need out of the box (both high level components and low level recipes via `cdk`)
- Documentation is clear, maintained by the team and kind of exhaustive, with live code exemples if needed ([and the new beta one is gorgeous](https://angular.dev/)). 
- `Angular` has both the reputation to make breaking changes and to provide tools to ease the migration. I remember all the drama that happened when `Angular 2` launched, breaking everything (we were starting a project with the first `beta` of `Angular 2`). It seems the lesson has been learned.

So angular it is.

`### Why Sass?

It comes with `Angular Material`, that was a massive point in the decision to go with `Anuglar`.

So `Sass` it is.

By the way, thanks `W3C` for `flexbox`! I've never liked writing `CSS`, but it's way less painful with `flexbox`!

I know about non-semantic `css`.  
I agree, at least on paper, as I've never tried this approach myself (but good people, outside the [`tailwind`](https://tailwindcss.com) team, agreed too).  
I didn't want to buy a [`tailwind`](https://tailwindcss.com) license.    
So I've written my `css`, via `sass`, the old fashion way... and I'm ok with it: this is a one human (for now) project, with a dozen components, I'm not a web agency. Guess I'll try that another time, or later in this project lifecycle 🤷.

## Backend API proxy

### Why an API proxy?

The main benefits are listed in the [API README](../app/roon-web-api).

But let's resume them here:
- a unique connection point with `roon`: if you want 10 `web clients` instances, it's just one `extension`. It's also a unique point where this connection lifecycle is managed.
- subscribing to all events for everything (zones, outputs, queues) and broadcasting these events was the best way both to simplify the `web client` development and to ensure fluid operation (when the displayed zone is changed in the browser, nothing to do, it's instant)
- I've strongly believed in [CQRS](https://martinfowler.com/bliki/CQRS.html), as an architecture pattern since I've been introduced to it. For this project, it was a way to prepare the development of futur features (like custom actions), while offering a clear separation of concerns between the publication of the `states` and the mutation of the `states`. Still, it's not a complete implementation: the way that `roon` API deals with music selection in `API` by `loading`, after `browsing` an `item` does not fit in this pattern. There's a rumor saying that software development is an engineering of tradeoffs
- Typing and simplifying the `API` was a big motivation: at the end, there 7 operations in 1 `endpoint`, way less that all what is exposed by `roon` API.

### Why SSE?

First for personal experimentation: I've already worked with `websocket`, never with `Server Sent Events`.  
It's also lighter to implement: no need to build a protocol, it's all text and ready to go.  
No need for binary data: the images will transit as `http` requests to be managed by the client app.

There's also a secret agenda: I'd like to experiment with `http2` multiplexing and see if **both** the long live request with the event stream and all other requests done by the app could share a unique underlying `TCP` connection. This might have no sens, being impossible by design, and I haven't spent any time on this. Still that was another motivation to experiment with `Server Sent Events`.

### Why a client package?

The `roon` API is highly connected: especially the content `browsing` and `loading` part.  
Each navigation session is isolated, and it's `state` is maintained by `roon`. You must provide a unique `multi_session_key` in your calls to indicate which session your making your navigation with.
There's no way to avoid this, it's the way it is.
So, it was clear, at early design stage, that I also needed to have a connected `API` while trying to keep as less `state` as possible in the `backend`.  

There were also the lifecycle of the `SSE` connection to manage.  
All the `events` are sent in the same `SSE` stream. On the other hand, for the application consuming the stream, it was better to isolate each `event` type.  
A [client](../packages/roon-web-client) was the best place to "demux" these events.

At the end, isolating this complexity in an abstraction layer was just making sens (both for development and for testing).

Finally, it was also a way to ease, for others, the development of their own `web application`: just fork the repo, remove the angular app, build what you want having this `client` as a dependency, copy the bundle in the appropriate folder during [CD](../.github/workflows/cd.yml) (see the step `Copy web app`), and you're good to go!

### Why Bun?

`bun` is used as a runtime, a package manager and a bundler on this project. It's also used to delegate to other tools when needed (`eslint`, `Angular CLI`, `vitest`).

After two years in this project life, `bun` appeared to be both stable and futur proof, at least as long as anthropic can burn cash. It's also fully OSS, so a fork could survive if needed.

After a quick integration phase, regarding the produced gains (no framework, just a simple integration of bun native `http`, native binary compiled artifact), the migration has been validated.

### Why typescript?

Because typings... and, also, typings.

Have I mentioned that I **strongly** believe that **strongly typed** code is exponentially easier to maintain while any dimension of a code base grows (complexity, size, lifetime, number of devs, you name it...)?

`JSDoc` can be an alternative, but I've worked with `typescript` many times and didn't want to lose any time with unexpected caveats discovering how to type vanilla `JS` via `JSDoc`, seems I'll test this stack later 🤷. 

As `typescript` is also the standard for `Angular`, at the end, it just made sens to go with `typescript`.
