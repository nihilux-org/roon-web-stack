# roon-web-ng-client

For now, this part is not really documented, but this is mainly a classic `Angular 17` app.

If you want to use the `cli` from the `root` of the `monorepo`, don't forget to prefix your `yarn` command:

```bash
yarn workspace @nihilux/roon-web-ng-client ng g c components/settings
# this command has been used to generate the scaffolding of the settings component
```

It's the best way to ensure everything works flawlessly, as `yarn` is defined as `package manager` in [angular.json](./angular.json).

## Development server

Run `yarn frontend` from the `root` of this `monorepo` for a dev server.

```bash
yarn frontend
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.  

The dev server is configured to proxy `/api` to `localhost:3000/api`, so if you also start the `backend` in dev mode, you should be good to go.

## Further help

To get more help on the Angular CLI use `yarn workspace @nihilux/roon-cqrs-web-ng-client ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.


## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
