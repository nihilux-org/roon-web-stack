# Contributing

The main architecture is not supposed to shift (see [stack choices](./doc/stack-choices.md)).

Even if testing is not complete, the main goal is still to:
- keep `100%` as a target for the [`client`](packages/roon-web-client/README.md) and the [`api`](app/roon-web-api/README.md) (still need to test the `Bun.serve()` routes and `app` entry point)
- add real testing to the [`angular app`](app/roon-web-ng-client/README.md) (I've been lazy on this, and wanted to have an MVP product as fast as possible to see the community feedback)

So there will be discussion if untested `code` is submitted in `PRs`.

The other rules are hold by the `es-lint` and `prettier` rules in each module, so it's `code`.  
To change them, submit a `PR` and let's talk!.

[Conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) and [squash on merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#squash-and-merge-your-commits) are two of the few things that are not debatable.

There's [`CI`](./.github/workflows/ci.yml) running on `PRs`: only building `PRs` will be reviewed.

Discussion must stay polite: we're not building the `linux kernel` (with which most of the servers, IOT and phones in the world run daily... once again, thanks Linus!).  
So we must keep it chill, as in fact, no one will really be impacted by the choices we make.

I've a job, other passions, and a personal life that I don't share on the Internet. If reviews are slow, it's a good sign: or I'm having fun doing something else, or there's a lot of contributors on the project.   

That said, I'll, at least, acknowledge any `PR` passing [`CI`](./.github/workflows/ci.yml) in the first week it's been submitted.
