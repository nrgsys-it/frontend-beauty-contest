# Next.js 15 App Router — Lifecycle & Technical Limits

## Struttura Cartelle App Router

L'app segue la convenzione file-system routing di Next.js 15 App Router. Ogni cartella dentro `src/app/` rappresenta un segmento di route; i file speciali (`layout.tsx`, `page.tsx`, `loading.tsx`, ecc.) determinano il comportamento del segmento.

```
src/app/
├── layout.tsx              ← Root layout (wrappa tutta l'app, non si smonta mai)
├── page.tsx                ← Home page (RSC)
├── globals.css             ← Stili globali importati nel root layout
├── chat/
│   └── page.tsx            ← /chat — RSC asincrono, legge searchParams come Promise
├── ssr-demo/
│   └── page.tsx            ← /ssr-demo — RSC con Suspense + use cache
├── ws-demo/
│   └── page.tsx
├── settings/
│   └── page.tsx
└── actions/
    └── messages.ts         ← Server Actions ('use server')

src/components/
├── chat/
│   ├── ChatLayout.tsx      ← 'use client' — gestisce WS + stato interattivo
│   ├── MessageArea.tsx     ← 'use client' — input + useTransition
│   ├── ConversationList.tsx
│   ├── ConversationListSkeleton.tsx
│   └── WsStatusBadge.tsx
└── ssr/
    ├── StatsCard.tsx
    ├── ConversationStats.tsx
    └── UserList.tsx

src/hooks/
└── useWebSocket.ts         ← 'use client' — hook per WebSocket con reconnect
```

**Nota**: `actions/` non è una route — è una convenzione di progetto per raggruppare le Server Actions. Next.js non assegna alcun significato speciale al nome `actions`.

---

## Entry Points

### layout.tsx

Il `RootLayout` è il componente più esterno dell'albero React. È un **React Server Component** (nessuna direttiva `'use client'`), viene renderizzato lato server e **non viene mai smontato** durante la navigazione client-side.

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | AASD Chat',   // '%s' viene sostituito dal title della pagina figlia
    default: 'AASD Chat — Next.js Beauty Contest',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header>...</header>
        <main>{children}</main>
        <footer>...</footer>
      </body>
    </html>
  )
}
```

**Regole chiave per layout.tsx:**
- Deve restituire `<html>` e `<body>` solo nel root layout.
- Può esportare `metadata` o `generateMetadata()` — solo in RSC.
- Non può usare `useState`, `useEffect`, o qualsiasi hook React.
- I layout annidati (`/chat/layout.tsx`) ricevono `children` che contengono il layout del livello superiore, non la page.

### page.tsx

La `page.tsx` è il leaf component della route. Può essere asincrono (RSC) e accedere direttamente a database, file system e variabili d'ambiente server.

```tsx
// src/app/chat/page.tsx
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>   // ← Next.js 15: searchParams è una Promise
}) {
  const { conv } = await searchParams
  const conversations = await getConversations()

  return (
    <Suspense fallback={<ConversationListSkeleton />}>
      <ChatLayout conversations={conversations} activeConversationId={conv ?? null} />
    </Suspense>
  )
}
```

**Differenza rispetto a Next.js 14:** `searchParams` e `params` sono ora Promise — bisogna sempre fare `await` prima di accedere alle proprietà.

### loading.tsx

Viene mostrato automaticamente come fallback Suspense mentre il segmento di route carica. È un RSC semplice senza logica.

```tsx
// src/app/chat/loading.tsx
export default function Loading() {
  return <div className="animate-pulse ...">Caricamento...</div>
}
```

Equivale a wrappare `<page>` in un `<Suspense>` nel layout genitore. Non presente nel progetto corrente — viene usato il fallback esplicito `<Suspense fallback={<ConversationListSkeleton />}>` nella page.

### error.tsx

Catch boundary per errori runtime nel segmento. **Deve essere un Client Component** perché usa `useEffect` internamente.

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Qualcosa è andato storto</h2>
      <button onClick={reset}>Riprova</button>
    </div>
  )
}
```

### not-found.tsx

Renderizzato quando viene chiamato `notFound()` da un RSC o quando la route non esiste.

```tsx
// src/app/not-found.tsx
export default function NotFound() {
  return <h2>Pagina non trovata</h2>
}
```

---

## React Server Components (RSC) vs Client Components

### Quando usare RSC

Un RSC è il default in App Router: qualsiasi file senza `'use client'` è un RSC.

**Usare RSC quando:**
- Si accede al database direttamente (come in `ssr-demo/page.tsx` con `prisma`)
- Si leggono variabili d'ambiente server-only (`process.env.DATABASE_URL`)
- Si vuole ridurre il JavaScript inviato al client
- Il componente è puramente presentazionale e non richiede interattività
- Si esporta `metadata` o si usa `generateStaticParams`

```tsx
// ✅ RSC: accede a Prisma direttamente, zero JS bundle aggiunto
async function fetchStats() {
  const [convCount, msgCount, userCount] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.user.count(),
  ])
  return { convCount, msgCount, userCount }
}
```

### Quando usare Client Components (`'use client'`)

**Usare `'use client'` quando:**
- Si usano hook React (`useState`, `useEffect`, `useRef`, `useTransition`, ecc.)
- Si usano browser API (`WebSocket`, `localStorage`, `window`, `document`)
- Si gestiscono eventi (`onClick`, `onChange`, `onSubmit`)
- Si usa `useRouter`, `usePathname`, `useSearchParams`

```tsx
// src/components/chat/ChatLayout.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function ChatLayout({ conversations, activeConversationId }) {
  const [activeId, setActiveId] = useState(activeConversationId)
  const [liveMessages, setLiveMessages] = useState([])
  // ...
}
```

### Boundary rules — cosa NON fare

La direttiva `'use client'` marca un **boundary**: il componente e tutti i suoi figli importati direttamente diventano Client Components.

```tsx
// ❌ SBAGLIATO: importare un RSC da un Client Component come child importato
'use client'
import HeavyServerComponent from './HeavyServerComponent' // diventa client!

// ✅ CORRETTO: passare RSC come children prop (non vengono "contaminati")
// In un RSC genitore:
<ClientShell>
  <HeavyServerComponent /> {/* rimane RSC */}
</ClientShell>
```

**Regola fondamentale:** Un Client Component non può importare un RSC. Può però ricevere RSC come `children` o come props.

### Pattern corretto per passare dati RSC → Client

```tsx
// ✅ Pattern del progetto: RSC fetcha i dati, Client Component li riceve come props
// chat/page.tsx (RSC)
const conversations = await getConversations()
return <ChatLayout conversations={conversations} activeConversationId={conv ?? null} />

// ChatLayout.tsx ('use client')
export default function ChatLayout({ conversations, activeConversationId }) {
  // conversations sono dati serializzati passati dall'RSC
}
```

**Attenzione:** Le props passate dall'RSC al Client Component devono essere **serializzabili** (JSON-compatibili). Non si possono passare funzioni, istanze di classe, `Date` raw, `Map`, `Set`, ecc.

---

## Ciclo di Vita Componenti

### RSC lifecycle (server-only)

Gli RSC non hanno lifecycle nel senso React classico. Vengono eseguiti **una volta** sul server per ogni richiesta (o serviti dalla cache).

```
1. Request HTTP in arrivo
2. Next.js risolve la route → individua layout.tsx + page.tsx
3. Esegue i componenti asincroni (await dati, query DB)
4. Genera il React Server Component Payload (RSC Payload — formato binario)
5. Streamma HTML + RSC Payload al browser
6. Il browser idrata i Client Components
```

Gli RSC non eseguono `useEffect`, non si rimontano, non reagiscono a state changes. Se i dati cambiano, l'intera route deve essere revalidata (`revalidatePath`) o richiesta di nuovo.

### Client Component lifecycle (mount/update/unmount)

I Client Components seguono il lifecycle React standard, con una peculiarità: vengono **pre-renderizzati sul server** (HTML statico) e poi **idratati** sul client.

```
SERVER:
  render() → HTML statico (nessun hook eseguito)

CLIENT:
  1. React riceve l'HTML pre-renderizzato
  2. Hydration: React "adotta" l'HTML esistente, associa i listener
  3. useEffect(() => { ... }, []) → si esegue dopo il mount
  4. Re-render su cambio di state/props
  5. Cleanup useEffect + unmount alla navigazione away
```

In `MessageArea.tsx` il pattern è esemplare:
```tsx
// Mount: carica i messaggi iniziali dal server
useEffect(() => {
  getMessages(conversationId).then(setMessages)
}, [conversationId])

// Auto-scroll su ogni nuovo messaggio
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages, liveMessages])
```

### Server Actions (`'use server'`)

Le Server Actions sono funzioni async che girano sul server ma possono essere chiamate dal client come se fossero funzioni locali. Next.js genera automaticamente un endpoint POST.

```tsx
// src/app/actions/messages.ts
'use server'

export async function sendMessage(data) {
  // Validazione
  const parsed = SendMessageSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Accesso DB diretto
  const message = await prisma.message.create({ ... })

  // Invalidazione cache
  revalidatePath('/chat')

  return { message }
}
```

**Flusso di esecuzione:**
1. Client chiama `sendMessage(data)` come funzione normale
2. Next.js serializza gli argomenti e invia una richiesta POST al server
3. Il server esegue la funzione, accede al DB
4. Il risultato viene serializzato e restituito al client
5. `revalidatePath('/chat')` invalida la cache RSC della route `/chat`

### `useTransition` e loading states

`useTransition` permette di marcare un aggiornamento di state come "non urgente", senza bloccare l'UI durante l'esecuzione di una Server Action.

```tsx
// src/components/chat/MessageArea.tsx
const [isPending, startTransition] = useTransition()

const handleSubmit = (e) => {
  e.preventDefault()
  startTransition(async () => {
    const result = await sendMessage({ content, conversationId, senderId })
    if (result.message) {
      wsSend({ type: 'chat', payload: { ... } })
      const fresh = await getMessages(conversationId)
      setMessages(fresh)
    }
  })
}

// isPending === true durante l'esecuzione → UI feedback
<button disabled={isPending}>{isPending ? '...' : 'Send'}</button>
```

---

## Hydration

### Come funziona

L'hydration è il processo con cui React "attiva" l'HTML statico pre-renderizzato dal server, associando i listener degli eventi e sincronizzando lo stato iniziale.

```
Server → genera HTML: <button class="...">Invia</button>
Client → React legge l'HTML esistente
        → confronta con il virtual DOM generato lato client
        → se corrispondono: aggiunge event listeners (idratazione OK)
        → se NON corrispondono: hydration mismatch → React riscrive il DOM
```

L'hydration avviene **una sola volta** al primo caricamento della pagina. Dopo, React gestisce gli aggiornamenti nel DOM direttamente (no full re-render).

### Hydration mismatch — cause comuni

Un mismatch si verifica quando l'HTML prodotto dal server è diverso da quello che React genera sul client durante l'hydration.

**Cause tipiche nel progetto:**

1. **Valori dipendenti dal tempo** (`new Date().toLocaleTimeString()`) — il server genera un orario diverso dal client.
2. **Browser-only APIs** accedute durante il render (non in `useEffect`) — `window`, `navigator`, `WebSocket`.
3. **Contenuto dipendente da `localStorage`/`sessionStorage`** — non disponibili sul server.
4. **Random IDs** generati con `Math.random()` o `crypto.randomUUID()` — diversi ad ogni render.
5. **Estensioni browser** che modificano il DOM (es. password managers che aggiungono attributi).

```tsx
// ❌ SBAGLIATO: window non esiste sul server → mismatch
export default function Component() {
  const isMobile = window.innerWidth < 768  // ReferenceError sul server!
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>
}

// ✅ CORRETTO: accedere a window solo dopo il mount
export default function Component() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])
  return <div>{isMobile ? 'Mobile' : 'Desktop'}</div>
}
```

### `suppressHydrationWarning` — quando usarlo (con cautela)

```tsx
// Usare SOLO per contenuto genuinamente diverso server/client
// (es. timestamp, contenuto dinamico da browser extension)
<time suppressHydrationWarning>
  {new Date().toLocaleTimeString()}
</time>
```

**Non usare** `suppressHydrationWarning` per mascherare bug reali. Sopprime solo il warning, non risolve il problema sottostante.

### Pattern sicuro per WebSocket + SSR (dal codice del progetto)

Il hook `useWebSocket` in `src/hooks/useWebSocket.ts` implementa il pattern corretto:

```tsx
'use client'  // ← OBBLIGATORIO: WebSocket non esiste sul server

export function useWebSocket({ conversationId, onMessage }) {
  const wsRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState<WsStatus>('disconnected') // ← stato iniziale sicuro

  // ✅ WebSocket creato SOLO dentro useEffect (mai durante il render)
  useEffect(() => {
    if (!conversationId) return
    connect()
    return () => {
      // ✅ Cleanup corretto: cancella timer + chiude WS
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [conversationId, connect])
}
```

**Perché funziona:** Il server renderizza `status = 'disconnected'` e non crea nessun WebSocket. Il client parte dallo stesso stato `'disconnected'` → nessun mismatch. Il WebSocket viene inizializzato solo dopo il mount (nel `useEffect`).

---

## Server vs Client Boundary

### `'use client'` — regole e conseguenze

- La direttiva va messa **in cima al file**, prima di qualsiasi import.
- Trasforma il modulo in un **entry point** del bundle client.
- Tutti i componenti importati da quel file diventano Client Components (anche senza `'use client'` esplicito).
- Il componente viene pre-renderizzato sul server (per l'HTML iniziale) **e poi** idratato sul client.

```tsx
'use client'
// ↑ Questo file + tutti i suoi import diretti → client bundle

import { useWebSocket } from '@/hooks/useWebSocket'  // anche questo diventa client
```

### `'use server'` — Server Actions

- Funzioni marcate con `'use server'` (file-level o inline) girano **solo** sul server.
- Possono essere chiamate da Client Components come funzioni async normali.
- Gli argomenti e il valore di ritorno devono essere **serializzabili**.
- Non si possono chiamare da altri RSC direttamente come Server Actions (si chiama la funzione normalmente).

```tsx
// ✅ Chiamata da Client Component (MessageArea.tsx)
startTransition(async () => {
  const result = await sendMessage({ content, conversationId, senderId })
})

// ✅ Chiamata da RSC come funzione normale (non come Server Action)
const conversations = await getConversations() // in chat/page.tsx
```

### Context providers e RSC

I Context providers (`React.createContext`) richiedono `'use client'`. Non si possono usare nei RSC. Il pattern corretto è wrappare il provider nel layout e passare il contenuto come `children` RSC.

```tsx
// ✅ Pattern corretto
// providers.tsx
'use client'
export function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

// layout.tsx (RSC)
import { Providers } from './providers'
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>  {/* children rimangono RSC */}
      </body>
    </html>
  )
}
```

### Serializable vs non-serializable props

Le props passate da RSC a Client Components devono essere serializzabili (convertibili in JSON):

| Serializzabile ✅ | Non serializzabile ❌ |
|---|---|
| `string`, `number`, `boolean` | Funzioni (`() => {}`) |
| `null`, `undefined` | Istanze di classe custom |
| Array e oggetti plain | `Date` (diventa stringa) |
| `Promise` (solo in RSC) | `Map`, `Set` |
| JSX/ReactNode | `Symbol` |

```tsx
// ❌ SBAGLIATO: funzione non serializzabile come prop da RSC
// (funziona solo se il RSC genitore è già client, ma è un antipattern)
<ClientComponent onSelect={(id) => console.log(id)} />

// ✅ CORRETTO: definire la callback nel Client Component stesso
// oppure usare Server Actions come callbacks
```

---

## Streaming con Suspense

### Come funziona il progressive rendering

Next.js 15 con App Router supporta lo **streaming HTTP**: l'HTML viene inviato al browser in chunks progressivi, senza attendere che tutti i dati siano pronti.

```
1. Request → Next.js inizia a renderizzare immediatamente
2. Le sezioni "pronte" (shell HTML, layout) vengono stremate subito
3. I componenti in attesa di dati mostrano il fallback Suspense
4. Quando i dati arrivano, React invia il componente renderizzato
   e sostituisce il fallback client-side (senza navigazione)
```

### Suspense boundaries nel progetto

```tsx
// src/app/ssr-demo/page.tsx — pattern completo
export default async function SsrDemoPage() {
  const statsPromise = getCachedStats()  // ← Promise NON ancora awaited

  return (
    <div>
      {/* Suspense 1: attende la Promise delle stats */}
      <Suspense fallback={<LoadingSkeleton />}>
        <StatsSection statsPromise={statsPromise} />
      </Suspense>

      {/* Suspense 2: ConversationStats fa il suo fetch internamente */}
      <Suspense fallback={<div className="h-48 animate-pulse" />}>
        <ConversationStats />
      </Suspense>

      {/* Suspense 3: indipendente da Suspense 2 */}
      <Suspense fallback={<div className="h-48 animate-pulse" />}>
        <UserList />
      </Suspense>
    </div>
  )
}

// StatsSection awaita la Promise passata come prop
async function StatsSection({ statsPromise }) {
  const { convCount, msgCount, userCount } = await statsPromise
  return <div className="grid grid-cols-3 gap-4">...</div>
}
```

`ConversationStats` e `UserList` vengono streamati **in parallelo**, non in sequenza. Il browser mostra il fallback di ognuno e lo sostituisce appena i dati arrivano.

### `loading.tsx` vs `<Suspense>` esplicito

| | `loading.tsx` | `<Suspense>` esplicito |
|---|---|---|
| Scope | Intera route/segmento | Sottoalbero specifico |
| Granularità | Bassa (page-level) | Alta (componente-level) |
| Configurazione | Zero (file convention) | Richiede `fallback` prop |
| Streaming | Sì | Sì |
| Uso nel progetto | Non usato | Usato in `chat/page.tsx` e `ssr-demo/page.tsx` |

Il progetto usa `<Suspense>` esplicito per avere controllo granulare sulle sezioni della pagina.

---

## Gestione Stato Cross-Boundary

### Zustand con RSC

Zustand (store client-side) non è compatibile con RSC. Il pattern corretto è inizializzare lo store nel Client Component a partire dai dati passati dall'RSC.

```tsx
// ✅ Pattern: RSC fetcha i dati, Client Component inizializza lo store
// page.tsx (RSC)
const initialMessages = await getMessages(conversationId)
return <MessageStore initialMessages={initialMessages} />

// MessageStore.tsx ('use client')
'use client'
export function MessageStore({ initialMessages }) {
  const setMessages = useMessagesStore((s) => s.setMessages)
  useEffect(() => {
    setMessages(initialMessages)
  }, [])
}
```

### URL state (`searchParams`)

Lo stato nella URL è il modo più semplice per condividere stato tra RSC e Client Components, ed è automaticamente serializzabile.

```tsx
// chat/page.tsx (RSC) — legge searchParams
const { conv } = await searchParams
const conversations = await getConversations()
return <ChatLayout activeConversationId={conv ?? null} />

// ChatLayout.tsx ('use client') — aggiorna la URL
const router = useRouter()
const handleSelectConversation = (id: string) => {
  router.push(`/chat?conv=${id}`, { scroll: false })
}
```

Navigare con `router.push` triggera un re-render dell'RSC genitore con i nuovi `searchParams`.

### `useTransition` per optimistic updates

```tsx
// MessageArea.tsx — optimistic update pattern
const handleSubmit = (e) => {
  e.preventDefault()
  const content = input.trim()
  setInput('')  // ← reset immediato (ottimistico)

  startTransition(async () => {
    // Server Action → DB → revalidate
    const result = await sendMessage({ content, conversationId, senderId })
    if (result.message) {
      wsSend({ type: 'chat', payload: { message: result.message } })
      const fresh = await getMessages(conversationId)
      setMessages(fresh)  // ← sincronizzazione con DB
    }
  })
}
```

---

## `use cache` (Next.js 15)

### Differenza con `React.cache()`

| | `React.cache()` | `'use cache'` (Next.js 15) |
|---|---|---|
| Scope | Per-request (request deduplication) | Cross-request (persistente) |
| Storage | Memory, per-render | Data store (Redis, filesystem) |
| Invalidazione | Automatica a fine request | `revalidatePath`, `revalidateTag`, TTL |
| Disponibilità | React 18+ | Next.js 15+ (sperimentale) |

`React.cache()` evita di chiamare due volte la stessa funzione **nella stessa request**. `'use cache'` memorizza il risultato **tra request diverse**.

### Quando usarlo

- Dati che cambiano raramente (stats aggregate, configurazioni)
- Query costose che non devono essere rieseguite per ogni richiesta
- Contenuto che può essere leggermente "stale" (cache invalidata periodicamente)

### Esempio dal progetto (`getCachedStats`)

```tsx
// src/app/ssr-demo/page.tsx
async function fetchStats() {
  const [convCount, msgCount, userCount] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.user.count(),
  ])
  return { convCount, msgCount, userCount }
}

// 'use cache' dentro la funzione = Next.js 15 caching
async function getCachedStats() {
  'use cache'
  return fetchStats()
}

export default async function SsrDemoPage() {
  const statsPromise = getCachedStats()  // la Promise viene passata a Suspense
  // ...
}
```

La direttiva `'use cache'` inline (non file-level) crea una funzione cached. Le successive richieste ricevono il risultato dalla cache senza interrogare il DB.

---

## Caveat & Pitfall osservati nel progetto

### 1. Hydration mismatch con WebSocket

**Il problema:** se si crea un WebSocket durante il render (non in `useEffect`), il server non può eseguirlo e il client sì → mismatch garantito.

```tsx
// ❌ SBAGLIATO: WebSocket creato durante il render
export function ChatLayout() {
  const ws = new WebSocket('ws://localhost:3002') // ReferenceError sul server!
  // ...
}
```

```tsx
// ✅ CORRETTO (pattern del progetto useWebSocket.ts)
'use client'
export function useWebSocket({ conversationId }) {
  const wsRef = useRef<WebSocket | null>(null)
  const [status, setStatus] = useState('disconnected') // ← stato iniziale identico server/client

  useEffect(() => {
    if (!conversationId) return
    connect() // WebSocket creato solo dopo il mount
    return () => wsRef.current?.close()
  }, [conversationId, connect])
}
```

**Perché:** `useEffect` non viene eseguito sul server → il server e il client partono dallo stesso stato iniziale `'disconnected'` → nessun mismatch.

---

### 2. `'use client'` contamination

**Il problema:** aggiungere `'use client'` a un componente "container" contamina tutti i componenti che importa, anche se potrebbero rimanere RSC.

```tsx
// ❌ SBAGLIATO: un unico componente 'use client' che importa tutto
'use client'
import HeavyDataTable from './HeavyDataTable'    // ora è client bundle!
import StaticSidebar from './StaticSidebar'       // ora è client bundle!
import { useWebSocket } from './useWebSocket'
```

```tsx
// ✅ CORRETTO: isolare il Client Component al minimo necessario
// InteractiveShell.tsx
'use client'
export function InteractiveShell({ children, onAction }) {
  const [state, setState] = useState(...)
  return <div onClick={onAction}>{children}</div>
}

// page.tsx (RSC)
<InteractiveShell onAction={...}>
  <HeavyDataTable />   {/* rimane RSC */}
  <StaticSidebar />    {/* rimane RSC */}
</InteractiveShell>
```

**Perché:** i `children` passati a un Client Component non vengono "contaminati" — vengono renderizzati nel contesto dell'RSC genitore.

---

### 3. Prisma singleton in dev mode

**Il problema:** in Next.js dev mode, l'hot-reload ricrea i moduli ad ogni modifica. Senza un singleton, vengono create decine di connessioni Prisma.

```tsx
// ❌ SBAGLIATO: nuova istanza Prisma ad ogni import
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

```tsx
// ✅ CORRETTO (pattern standard Next.js + Prisma)
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Perché:** `globalThis` sopravvive all'hot-reload in dev. In produzione, il modulo viene caricato una sola volta, quindi il check `globalForPrisma.prisma` non è necessario ma non causa danni.

---

### 4. `searchParams` come Promise in Next.js 15

**Il problema:** in Next.js 15, `searchParams` e `params` nelle page e nei layout sono ora `Promise`. Accedere direttamente alle proprietà senza `await` restituisce `undefined`.

```tsx
// ❌ SBAGLIATO (Next.js 14 syntax — non funziona in Next.js 15)
export default function ChatPage({ searchParams }: { searchParams: { conv?: string } }) {
  const conv = searchParams.conv  // undefined! searchParams è una Promise
}
```

```tsx
// ✅ CORRETTO (Next.js 15 — dal progetto chat/page.tsx)
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>
}) {
  const { conv } = await searchParams  // ← await obbligatorio
  const conversations = await getConversations()
  return <ChatLayout conversations={conversations} activeConversationId={conv ?? null} />
}
```

**Perché:** il cambio è intenzionale per supportare il rendering streaming — Next.js può iniziare a renderizzare prima che i search params siano risolti.

---

### 5. `revalidatePath` scope

**Il problema:** `revalidatePath('/chat')` invalida la cache dell'intera route `/chat`, inclusi i segmenti annidati. Se si usa uno scope troppo ampio, si invalida più del necessario; troppo stretto, non si invalida abbastanza.

```tsx
// ❌ POTENZIALMENTE ECCESSIVO: invalida tutta l'app
revalidatePath('/', 'layout')

// ❌ INSUFFICIENTE: potrebbe non coprire route annidate
revalidatePath('/chat/[id]')  // non invalida /chat
```

```tsx
// ✅ CORRETTO (dal progetto messages.ts)
revalidatePath('/chat')  // invalida /chat e tutti i segmenti figli

// Per invalidazione granulare, usare revalidateTag
revalidateTag('messages')  // richiede fetch({ next: { tags: ['messages'] } })
```

**Perché:** `revalidatePath` con path senza parametri invalida tutte le varianti di quella route (con e senza searchParams). Usare `revalidateTag` per controllo più fine.

---

### 6. Tailwind v4 `@import` vs `@tailwind`

**Il problema:** Tailwind v4 usa una nuova sintassi di configurazione. La direttiva `@tailwind base/components/utilities` non esiste più.

```css
/* ❌ SBAGLIATO: sintassi Tailwind v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css
/* ✅ CORRETTO: sintassi Tailwind v4 (dal progetto globals.css) */
@import 'tailwindcss';

/* Customizzazioni via @theme */
@theme {
  --color-primary: #3b82f6;
}
```

**Perché:** Tailwind v4 unifica tutto in un singolo `@import 'tailwindcss'` e usa CSS custom properties per i design tokens invece di `tailwind.config.js`.

---

### 7. Server Action error handling

**Il problema:** le Server Actions lanciano eccezioni che, se non gestite, vengono esposte al client o causano crash silenti. Le eccezioni Prisma contengono dettagli sensibili (struttura DB, query).

```tsx
// ❌ SBAGLIATO: nessuna gestione errori
export async function sendMessage(data) {
  'use server'
  const message = await prisma.message.create({ data })  // può lanciare!
  revalidatePath('/chat')
  return { message }
}
```

```tsx
// ✅ CORRETTO: validazione input + gestione errori esplicita
export async function sendMessage(data: z.infer<typeof SendMessageSchema>) {
  // 1. Validazione input con Zod (dal progetto)
  const parsed = SendMessageSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const message = await prisma.message.create({ ... })
    revalidatePath('/chat')
    return { message }
  } catch (e) {
    console.error('[sendMessage] DB error:', e)
    return { error: 'Impossibile inviare il messaggio' }  // messaggio generico al client
  }
}
```

**Perché:** le Server Actions devono sempre restituire un oggetto con `{ error }` o `{ data }` — mai lanciare eccezioni non gestite verso il client. Usare Zod per validare l'input prima di toccare il DB.

---

### 8. `useEffect` per WebSocket init — dipendenze instabili

**Il problema:** se `onMessage` callback viene ricreata ad ogni render del componente padre, il `useEffect` nel hook WebSocket si riesegue continuamente (disconnect/reconnect loop).

```tsx
// ❌ SBAGLIATO: callback ricreata ad ogni render di ChatLayout
export default function ChatLayout({ ... }) {
  const { status } = useWebSocket({
    conversationId: activeId,
    onMessage: (msg) => {  // ← nuova funzione ad ogni render!
      if (msg.type === 'chat') setLiveMessages(prev => [...prev, msg.payload.message])
    },
  })
}
```

```tsx
// ✅ CORRETTO (dal progetto ChatLayout.tsx)
export default function ChatLayout({ ... }) {
  // useCallback memoizza la funzione → identità stabile tra render
  const handleWsMessage = useCallback((msg: WsMessageType) => {
    if (msg.type === 'chat') {
      setLiveMessages((prev) => [...prev, msg.payload.message])
    }
  }, [])  // ← dipendenze vuote = funzione creata una sola volta

  const { status, sendMessage } = useWebSocket({
    conversationId: activeId,
    onMessage: handleWsMessage,  // ← identità stabile
  })
}
```

**Perché:** `useWebSocket` ha `onMessage` nelle sue dipendenze (`useCallback` in `connect`). Se `onMessage` cambia identità ad ogni render, `connect` si ricalcola, il `useEffect` si riesegue, la connessione WebSocket viene chiusa e riaperta continuamente.
