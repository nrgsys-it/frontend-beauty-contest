## Struttura di `src/AASD.Angular`

L'app e un progetto Angular 21 standalone con supporto SSR gia configurato tramite builder moderno (`@angular/build:application`) e integrazione Node/Express.

### Cartelle e file top-level principali

- `src/`: codice applicativo; contiene bootstrap client/server, componente root e configurazioni Angular.
- `src/app/`: nucleo applicazione (componente `App`, routing, provider globali e config SSR dedicata).
- `public/`: asset statici copiati in build (es. `favicon.ico`).
- `angular.json`: orchestrazione build/serve/test; definisce i punti di ingresso browser/server e l'entry SSR Node.
- `package.json`: dipendenze Angular 21 + `@angular/ssr` + `express`, script di sviluppo/build e avvio server SSR compilato.
- `tsconfig*.json`: configurazione TypeScript per app e test.

### Entry point e configurazione SSR presenti

- `src/main.ts`: bootstrap lato browser (`bootstrapApplication(App, appConfig)`).
- `src/main.server.ts`: bootstrap lato server con `config` SSR (`export default bootstrap`).
- `src/server.ts`: server Express che serve statici da `dist/.../browser` e delega il rendering ad `AngularNodeAppEngine`.
- `src/app/app.config.ts`: provider comuni client (router, hydration, event replay).
- `src/app/app.config.server.ts`: merge della config base con `provideServerRendering(withRoutes(serverRoutes))`.
- `src/app/app.routes.server.ts`: regole di rendering server; attualmente `path: '**'` con `RenderMode.Prerender`.
- `angular.json`: `build.options.browser = src/main.ts`, `server = src/main.server.ts`, `outputMode = server`, `ssr.entry = src/server.ts`.
- `package.json`: script `serve:ssr:AASD.Angular` per eseguire il bundle server (`node dist/AASD.Angular/server/server.mjs`).

### Nota organizzativa

La struttura e coerente con template Angular SSR recente: configurazione unificata in `angular.json`, bootstrap separato client/server, e host Node esplicito per integrare API custom in `server.ts` se necessario.
