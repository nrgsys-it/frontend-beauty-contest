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

## Note tecniche per presentazione interna

### Standalone components (direzione attuale)

- Il progetto e impostato in modalita standalone-first: componenti importati direttamente (`imports: [...]`) e nessun `NgModule` applicativo.
- Il bootstrap usa `bootstrapApplication(App, appConfig)` in `src/main.ts` e la variante server in `src/main.server.ts`.
- Le route puntano direttamente a componenti (`HomePage`, `ChatPage`, `SettingsPage`) senza layer modulo intermedio.
- Implicazione pratica: quando si aggiunge un componente, le dipendenze template (`RouterLink`, `NgIf`, componenti custom, ecc.) vanno dichiarate nel suo `imports`.

### Routing e navigazione

- Routing centrale in `src/app/app.routes.ts` con 3 percorsi: `/`, `/chat`, `/settings`.
- I provider router sono registrati in `src/app/app.config.ts` tramite `provideRouter(routes)`.
- Il rendering SSR e dichiarato in `src/app/app.routes.server.ts` con wildcard `**` su `RenderMode.Prerender`.
- Nel template header attuale i link sono `<a href="...">`: questo forza navigazione browser completa (round-trip SSR) invece della navigazione SPA lato client.

### Layouts (struttura UI)

- `App` monta `app-main-layout` come shell principale (`src/app/app.html`).
- `MainLayout` contiene header fisso + `router-outlet` (`src/app/layouts/main-layout/main-layout.html`).
- Pattern attuale: un solo layout globale applicato a tutte le pagine.
- Implicazione pratica: per futuri flussi con layout diversi (es. login senza header), conviene spostare il layout dentro la configurazione route (route parent + children).

### Integrazione Tailwind

- Tailwind v4 e attivato in modo minimale con `@import 'tailwindcss';` in `src/styles.css`.
- Pipeline PostCSS abilitata in `.postcssrc.json` con plugin `@tailwindcss/postcss`.
- Le utility Tailwind sono usate direttamente nei template (`flex`, `h-screen`, `bg-*`, ecc.) senza layer SCSS dedicato.
- Sono presenti design tokens CSS custom in `:root` (`--color-ink-black-*`) consumati da classi arbitrarie (`bg-[var(--color-ink-black-950)]`).

### Custom elements e `CUSTOM_ELEMENTS_SCHEMA`

- In `Header` e dichiarato `schemas: [CUSTOM_ELEMENTS_SCHEMA]` per permettere tag non Angular come `el-dialog`, `el-disclosure`, `el-popover-group`.
- Il runtime degli elementi viene caricato in `src/main.ts` con `import '@tailwindplus/elements';` (solo lato browser).
- Vantaggio: integrazione rapida di web components nel template Angular.
- Trade-off: `CUSTOM_ELEMENTS_SCHEMA` riduce i controlli template su tag/attributi sconosciuti; errori di typo nei custom tag possono passare inosservati in compilazione.

### Caveat / pitfall osservati nel codice corrente

- `App` importa `Header` e `HomePage` in `src/app/app.ts`, ma il template usa solo `MainLayout`: import ridondanti da ripulire.
- Test root non allineato allo stato UI: `src/app/app.spec.ts` cerca un `h1` con testo "Hello, AASD.Angular" che non esiste nel template attuale.
- Header basato su link `href` invece di `routerLink`: UX meno fluida lato client e maggiore reload pagina.
- `ChatPage` contiene ancora uno style inline di debug (`style="background-color: red;"`), utile da rimuovere prima di demo/produzione.
- In `src/index.html` il `lang` e ancora `en`: se il target primario e italiano, conviene allinearlo (`it`) per accessibilita/SEO.
