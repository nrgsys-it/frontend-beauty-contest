# Next.js 15 — Frontend Beauty Contest

## 1. Struttura Progetto

Il progetto è un'applicazione Next.js 15 standalone con App Router, SSR configurato nativamente e server WebSocket separato.

### Cartelle e file top-level principali

- `src/app/`: nucleo dell'applicazione — layout root, pagine, Server Actions, file convention speciali (`loading.tsx`, `error.tsx`, `not-found.tsx`).
- `src/components/`: componenti React organizzati per dominio (`chat/`, `ssr/`). I componenti interattivi dichiarano `'use client'`; i presentazionali puri restano RSC.
- `src/hooks/`: custom hooks client-side (`useWebSocket.ts`).
- `src/lib/`: utilities condivise (singleton Prisma, helpers).
- `ws-server/`: server WebSocket separato (`index.ts`) — processo Node.js indipendente su porta 3002, non eseguito dentro Next.js.
- `prisma/`: schema Prisma e migration per PostgreSQL.
- `next.config.ts`: configurazione Next.js (sperimentale `use cache`, Turbopack, env vars).
- `package.json`: dipendenze Next.js 15 + React 19, librerie selezionate, script di sviluppo e produzione.
- `tsconfig.json`: configurazione TypeScript con path alias (`@/` → `src/`).
- `.env.local` / `.env.example`: variabili d'ambiente locali (`DATABASE_URL`, `WS_PORT`).

### Struttura `src/app/` (App Router)

```
src/app/
├── layout.tsx              ← Root layout (RSC — non si smonta mai)
├── page.tsx                ← Home page (RSC)
├── loading.tsx             ← Fallback Suspense globale
├── error.tsx               ← Error boundary globale ('use client')
├── not-found.tsx           ← Pagina 404
├── globals.css             ← Stili globali + Tailwind v4 @import
├── chat/
│   └── page.tsx            ← /chat — RSC asincrono, legge searchParams come Promise
├── ssr-demo/
│   └── page.tsx            ← /ssr-demo — RSC con Suspense + use cache
├── ws-demo/
│   └── page.tsx            ← /ws-demo — demo connessione WebSocket
├── libs-demo/
│   └── page.tsx            ← /libs-demo — showcase librerie integrate
├── settings/
│   └── page.tsx            ← /settings — configurazione utente
└── actions/
    └── messages.ts         ← Server Actions ('use server')
```

### Struttura `src/components/`

```
src/components/
├── chat/
│   ├── ChatLayout.tsx          ← 'use client' — gestisce WS + stato interattivo
│   ├── MessageArea.tsx         ← 'use client' — input + useTransition
│   ├── ConversationList.tsx    ← lista conversazioni
│   ├── ConversationListSkeleton.tsx ← skeleton loader
│   └── WsStatusBadge.tsx       ← badge stato connessione WS
└── ssr/
    ├── StatsCard.tsx           ← card statistica RSC
    ├── ConversationStats.tsx   ← stats aggregate da Prisma (RSC)
    └── UserList.tsx            ← lista utenti da Prisma (RSC)
```

---

## 2. Entry Point e Configurazione SSR

### App Router come sistema di rendering

Next.js 15 App Router unifica SSR, SSG, ISR e React Server Components in un unico modello. Non esistono file di bootstrap separati per client e server (a differenza di Angular): il framework gestisce automaticamente la separazione tramite le direttive `'use client'` / `'use server'`.

### `layout.tsx` — Root Layout (RSC)

Il `RootLayout` è il componente più esterno. È un **React Server Component** puro: nessuna direttiva, nessun hook, eseguito solo sul server.

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | AASD Chat',       // '%s' sostituito dal title della pagina figlia
    default: 'AASD Chat — Next.js Beauty Contest',
  },
  description: 'Beauty Contest: Next.js Chat App with SSR and Real-time WebSocket',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">AASD Chat</Link>
            <div className="flex items-center gap-6">
              <Link href="/chat" className="text-sm text-gray-600">Chat</Link>
              <Link href="/ssr-demo" className="text-sm text-gray-600">SSR Demo</Link>
              <Link href="/ws-demo" className="text-sm text-gray-600">WS Demo</Link>
            </div>
            <div className="text-xs text-gray-400 font-mono">Next.js 15 · SSR</div>
          </nav>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 mt-auto">
          <div className="container mx-auto px-4 h-12 flex items-center justify-center text-xs text-gray-400">
            AASD Beauty Contest — Next.js · React Server Components · WebSocket
          </div>
        </footer>
      </body>
    </html>
  )
}
```

**Regole chiave:**
- Solo il root layout restituisce `<html>` e `<body>`.
- `metadata` può essere esportato solo da RSC.
- Non ammette `useState`, `useEffect` o qualsiasi hook React.
- Non viene mai smontato durante la navigazione client-side (SPA navigation).

### RSC vs Client Components — separazione delle responsabilità

| | RSC (default) | Client Component (`'use client'`) |
|---|---|---|
| Eseguito su | Server (a ogni request o dalla cache) | Server (pre-render HTML) + Client (hydration) |
| Accesso DB | ✅ diretto (Prisma) | ❌ solo via API/Server Action |
| Hook React | ❌ non ammessi | ✅ useState, useEffect, useRef... |
| Browser API | ❌ non disponibili | ✅ WebSocket, localStorage, window |
| JS bundle client | ✅ zero (non incluso) | ⚠️ incluso nel bundle |
| `metadata` export | ✅ | ❌ |

---

## 3. Routing e Navigazione

### File-based routing con App Router

Il routing è determinato dalla struttura delle cartelle sotto `src/app/`. Non esiste un file di configurazione delle route: la presenza di un file `page.tsx` in una cartella definisce una route pubblica.

| Cartella | URL | Tipo |
|---|---|---|
| `app/page.tsx` | `/` | RSC |
| `app/chat/page.tsx` | `/chat` | RSC asincrono |
| `app/ssr-demo/page.tsx` | `/ssr-demo` | RSC con Suspense |
| `app/ws-demo/page.tsx` | `/ws-demo` | RSC / Client |
| `app/libs-demo/page.tsx` | `/libs-demo` | Client demo |
| `app/settings/page.tsx` | `/settings` | RSC |

### `Link` component — navigazione SPA

A differenza del branch Angular (che usa `<a href>` con full page reload), il progetto Next.js usa il componente `<Link>` di Next.js per navigazione SPA client-side:

```tsx
// layout.tsx — navigazione senza reload
import Link from 'next/link'

<Link href="/chat" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
  Chat
</Link>
```

`<Link>` esegue **prefetching automatico** degli RSC in viewport, rendendo la navigazione percettivamente istantanea.

### `searchParams` come state di navigazione

In Next.js 15, `searchParams` nelle page è una **Promise** (breaking change rispetto a v14):

```tsx
// src/app/chat/page.tsx
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>  // ← Promise in Next.js 15
}) {
  const { conv } = await searchParams       // ← await obbligatorio
  const conversations = await getConversations()

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <Suspense fallback={<ConversationListSkeleton />}>
        <ChatLayout conversations={conversations} activeConversationId={conv ?? null} />
      </Suspense>
    </div>
  )
}
```

Il Client Component aggiorna la URL con `useRouter`:

```tsx
// ChatLayout.tsx ('use client')
const router = useRouter()
const handleSelectConversation = (id: string) => {
  router.push(`/chat?conv=${id}`, { scroll: false })
  // → triggera re-render dell'RSC con nuovi searchParams
}
```

---

## 4. Layouts

### Root layout e layout annidati

Next.js supporta layout annidati per gerarchia. Il root layout (`app/layout.tsx`) si applica a tutte le route. Un layout annidato (`app/chat/layout.tsx`) si applicherebbe solo alle route sotto `/chat`, mantenendo il root layout come wrapper esterno.

**Il progetto usa un singolo layout globale** con header + footer fisso e `<main>` come area di contenuto. Il pattern è più flessibile di Angular: aggiungere un layout specifico per `/chat` (es. senza footer) richiede solo aggiungere `app/chat/layout.tsx`.

### File convention speciali

| File | Descrizione | Tipo |
|---|---|---|
| `layout.tsx` | Wrappa tutte le pagine figlie, non si smonta | RSC |
| `page.tsx` | Leaf component della route, pubblicamente accessibile | RSC (o Client) |
| `loading.tsx` | Fallback Suspense automatico durante il caricamento della route | RSC |
| `error.tsx` | Error boundary per il segmento — deve essere Client Component | `'use client'` |
| `not-found.tsx` | Renderizzato quando viene chiamato `notFound()` | RSC |

```tsx
// src/app/error.tsx — error boundary globale
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold text-red-600">Qualcosa è andato storto</h2>
      <p className="text-gray-500 text-sm">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Riprova
      </button>
    </div>
  )
}
```

### Route groups

Per organizzare route senza creare segmenti URL, Next.js supporta **route groups** con sintassi `(nome)`. Non usati nel progetto corrente ma disponibili per una futura separazione tra area pubblica e autenticata:

```
app/
├── (public)/
│   └── page.tsx        → /
├── (app)/
│   ├── layout.tsx      ← layout autenticato
│   ├── chat/
│   │   └── page.tsx    → /chat
│   └── settings/
│       └── page.tsx    → /settings
```

---

## 5. Real-time WebSocket

### Architettura: WS server separato

Il WebSocket è implementato come **processo Node.js indipendente** (`ws-server/index.ts`) sulla porta 3002, separato dal processo Next.js. Questa scelta è necessaria perché Next.js App Router non supporta nativamente connessioni WebSocket persistenti sullo stesso processo HTTP.

```
Client (browser)
    │  WebSocket ws://localhost:3002/chat
    ▼
ws-server/index.ts           ← processo Node.js separato
    │  room management: Map<conversationId, Set<WebSocket>>
    │  broadcast per room
    ▼
Altri client nella stessa room
```

### WS Server — gestione rooms e broadcast

```typescript
// ws-server/index.ts (estratto)
import { WebSocketServer, WebSocket } from 'ws'

const WS_PORT = parseInt(process.env.WS_PORT || '3002', 10)
const rooms = new Map<string, Set<WebSocket>>()  // conversationId → clients
const clients = new Set<WebSocket>()

// Messaggi gestiti: join | leave | chat | ping | createConversation
wss.on('connection', (ws, req) => {
  clients.add(ws)

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString()) as IncomingWsMessage

    switch (msg.type) {
      case 'join':
        joinRoom(msg.payload.conversationId, ws)
        sendToClient(ws, { type: 'joined', payload: { conversationId: msg.payload.conversationId } })
        break
      case 'chat':
        broadcast(msg.payload.conversationId, JSON.stringify(msg))
        break
      case 'ping':
        sendToClient(ws, { type: 'pong' })
        break
      // ...
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    leaveAllRooms(ws)  // cleanup automatico da tutte le rooms
  })
})

server.listen(WS_PORT)
// Health check HTTP: GET /health → { status: 'ok', rooms: N, port: 3002 }
```

### `useWebSocket` — hook client-side con reconnect

```typescript
// src/hooks/useWebSocket.ts — pattern SSR-safe
'use client'  // ← obbligatorio: WebSocket non esiste sul server

export function useWebSocket({ conversationId, onMessage }) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [status, setStatus] = useState<WsStatus>('disconnected')  // ← stato sicuro per SSR

  const connect = useCallback(() => {
    const ws = new WebSocket(`ws://localhost:3002/chat`)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      ws.send(JSON.stringify({ type: 'join', payload: { conversationId } }))
    }
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      onMessage(msg)
    }
    ws.onclose = () => {
      setStatus('reconnecting')
      // Reconnect automatico dopo 3 secondi
      reconnectTimerRef.current = setTimeout(connect, 3000)
    }
  }, [conversationId, onMessage])

  useEffect(() => {
    if (!conversationId) return
    connect()
    return () => {
      // Cleanup: cancella timer + chiude connessione
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [conversationId, connect])

  return { status, sendMessage: wsSend }
}
```

### Messaggio `sendMessage` — flusso completo

1. Utente invia messaggio → `MessageArea.tsx` chiama Server Action `sendMessage()`
2. Server Action persiste su DB + `revalidatePath('/chat')`
3. Server Action ritorna il messaggio salvato
4. `ChatLayout.tsx` chiama `wsSend({ type: 'chat', payload: { message } })`
5. WS Server riceve e fa broadcast ai client nella stessa room
6. Gli altri client ricevono il messaggio via `onMessage` callback → `setLiveMessages`

---

## 6. Librerie Integrate

### Stack selezionato

| Libreria | Versione | Download/week | Compatibilità RSC |
|---|---|---|---|
| **Zustand** | ^5.0 | ~32M | ⚠️ Client-only |
| **TanStack Query v5** | ^5.99 | ~49.7M | ✅ Full (prefetch RSC) |
| **Framer Motion** | ^12.x | ~40M | ⚠️ Client-only |
| **shadcn/ui** | CLI latest | N/A (78K stars) | ⚠️ Client per interattivi |
| **Zod** | ^3.24 | ~12M | ✅ Full (server + client) |

### 1. Zustand — state management UI

```typescript
// Esempio: store messaggi chat
import { create } from 'zustand'

interface ChatStore {
  liveMessages: Message[]
  addMessage: (msg: Message) => void
  wsStatus: 'connected' | 'disconnected' | 'reconnecting'
  setWsStatus: (status: WsStatus) => void
}

const useChatStore = create<ChatStore>((set) => ({
  liveMessages: [],
  addMessage: (msg) => set((state) => ({ liveMessages: [...state.liveMessages, msg] })),
  wsStatus: 'disconnected',
  setWsStatus: (status) => set({ wsStatus: status }),
}))
```

**Nessun provider richiesto**: lo store è disponibile in qualsiasi Client Component con `useChatStore()`.

### 2. TanStack Query v5 — server state con cache

```typescript
// Pattern RSC prefetch + client hydration
// page.tsx (RSC) — prefetch queries prima del render client
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

export default async function ConversationsPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ConversationsList />
    </HydrationBoundary>
  )
}

// ConversationsList.tsx ('use client') — riceve la cache già idratata
const { data: conversations } = useQuery({
  queryKey: ['conversations'],
  queryFn: fetchConversations,
  staleTime: 30_000,  // cache valida 30 secondi
})
```

### 3. Framer Motion — animazioni messaggi

```tsx
// MessageBubble — animazione entry dei messaggi
'use client'
import { motion, AnimatePresence } from 'motion/react'

export function MessageBubble({ message }: { message: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex gap-3 p-4"
    >
      <span>{message.content}</span>
    </motion.div>
  )
}

// AnimatePresence per la lista messaggi — gestisce mount/unmount animati
<AnimatePresence initial={false}>
  {messages.map((msg) => (
    <MessageBubble key={msg.id} message={msg} />
  ))}
</AnimatePresence>
```

### 4. shadcn/ui — component library

shadcn/ui non è un pacchetto npm tradizionale: i componenti vengono copiati nel progetto via CLI e sono di tua proprietà. Basata su Radix UI (accessibilità WAI-ARIA) + Tailwind CSS v4.

```tsx
// Componenti shadcn/ui utilizzati nel progetto
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Esempio: area input messaggi
<div className="flex gap-2">
  <Input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Scrivi un messaggio..."
    className="flex-1"
  />
  <Button type="submit" disabled={isPending}>
    {isPending ? '...' : 'Invia'}
  </Button>
</div>
```

### 5. Zod — validazione type-safe

```typescript
// src/app/actions/messages.ts — Server Action con validazione Zod
'use server'
import { z } from 'zod'

const SendMessageSchema = z.object({
  content: z.string().min(1, 'Il messaggio non può essere vuoto').max(2000),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid().optional(),
})

export async function sendMessage(data: unknown) {
  // 1. Validazione input — blocca prima di toccare il DB
  const parsed = SendMessageSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  try {
    const message = await prisma.message.create({ data: parsed.data })
    revalidatePath('/chat')
    return { message }
  } catch (e) {
    console.error('[sendMessage]', e)
    return { error: 'Impossibile inviare il messaggio' }
  }
}
```

---

## 7. Lifecycle e Hydration

### RSC lifecycle (server-only)

Gli RSC non hanno lifecycle nel senso React classico. Vengono eseguiti **una volta** per request (o dalla cache).

```
1. Request HTTP in arrivo
2. Next.js risolve la route → individua layout.tsx + page.tsx
3. Esegue i componenti asincroni (await dati, query DB via Prisma)
4. Genera il React Server Component Payload (RSC Payload — formato binario)
5. Streamma HTML + RSC Payload al browser
6. Il browser idrata i Client Components
```

Gli RSC non eseguono `useEffect`, non si rimontano, non reagiscono a state changes. I dati si aggiornano tramite `revalidatePath()` o `revalidateTag()`.

### Client Component lifecycle

```
SERVER:
  render() → HTML statico (nessun hook eseguito, WebSocket non creato)

CLIENT:
  1. React riceve l'HTML pre-renderizzato
  2. Hydration: React "adotta" l'HTML, associa i listener
  3. useEffect(() => {}, []) → si esegue dopo il mount
  4. Re-render su cambio di state/props
  5. Cleanup useEffect + unmount alla navigazione away
```

### Server Actions — flusso completo

```tsx
// Client chiama come funzione normale
const [isPending, startTransition] = useTransition()

const handleSubmit = (e) => {
  e.preventDefault()
  startTransition(async () => {
    const result = await sendMessage({ content, conversationId, senderId })
    // 1. Next.js serializza gli args → POST al server
    // 2. Server esegue la funzione, accede al DB
    // 3. revalidatePath('/chat') → invalida cache RSC
    // 4. Risultato serializzato → restituito al client
    if (result.message) {
      wsSend({ type: 'chat', payload: { message: result.message } })
      const fresh = await getMessages(conversationId)
      setMessages(fresh)
    }
  })
}

<button disabled={isPending}>{isPending ? '...' : 'Send'}</button>
```

### `use cache` — caching cross-request (Next.js 15)

```tsx
// src/app/ssr-demo/page.tsx
async function getCachedStats() {
  'use cache'  // ← direttiva inline: risultato cachato tra request diverse
  const [convCount, msgCount, userCount] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.user.count(),
  ])
  return { convCount, msgCount, userCount }
}

export default async function SsrDemoPage() {
  const statsPromise = getCachedStats()  // Promise passata a Suspense — non awaited qui

  return (
    <div>
      <Suspense fallback={<LoadingSkeleton />}>
        <StatsSection statsPromise={statsPromise} />
      </Suspense>
      {/* Streaming parallelo: ciascun Suspense si risolve indipendentemente */}
      <Suspense fallback={<div className="h-48 animate-pulse" />}>
        <ConversationStats />
      </Suspense>
      <Suspense fallback={<div className="h-48 animate-pulse" />}>
        <UserList />
      </Suspense>
    </div>
  )
}
```

| | `React.cache()` | `'use cache'` (Next.js 15) |
|---|---|---|
| Scope | Per-request (deduplication) | Cross-request (persistente) |
| Storage | Memory, per-render | Data store (Redis, filesystem) |
| Invalidazione | Automatica a fine request | `revalidatePath`, `revalidateTag`, TTL |

---

## 8. Caveat e Pitfall Osservati

### 1. Hydration mismatch con WebSocket ❌/✅

```tsx
// ❌ SBAGLIATO: WebSocket creato durante il render → ReferenceError sul server
export function ChatLayout() {
  const ws = new WebSocket('ws://localhost:3002') // server: WebSocket non esiste!
}
```

```tsx
// ✅ CORRETTO (pattern useWebSocket.ts del progetto)
'use client'
export function useWebSocket({ conversationId }) {
  const [status, setStatus] = useState('disconnected') // stesso stato server/client

  useEffect(() => {
    if (!conversationId) return
    connect() // WebSocket creato SOLO dopo il mount, mai durante il render
    return () => wsRef.current?.close()
  }, [conversationId, connect])
}
```

**Perché:** `useEffect` non viene eseguito sul server. Stato iniziale identico → nessun mismatch.

---

### 2. `'use client'` contamination ❌/✅

```tsx
// ❌ SBAGLIATO: un Client Component che importa tutto contamina l'intero albero
'use client'
import HeavyDataTable from './HeavyDataTable'  // diventa client bundle!
import StaticSidebar from './StaticSidebar'    // diventa client bundle!
```

```tsx
// ✅ CORRETTO: isolare il boundary al minimo necessario
// InteractiveShell.tsx
'use client'
export function InteractiveShell({ children, onAction }) {
  const [state, setState] = useState(...)
  return <div onClick={onAction}>{children}</div>
}

// page.tsx (RSC)
<InteractiveShell onAction={...}>
  <HeavyDataTable />   {/* rimane RSC — zero JS bundle */}
  <StaticSidebar />    {/* rimane RSC */}
</InteractiveShell>
```

---

### 3. Prisma singleton in dev mode ❌/✅

```typescript
// ❌ SBAGLIATO: nuova istanza ad ogni hot-reload → connection pool esaurito
import { PrismaClient } from '@prisma/client'
export const prisma = new PrismaClient()
```

```typescript
// ✅ CORRETTO (src/lib/prisma.ts)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma  // globalThis sopravvive all'hot-reload
}
```

---

### 4. `searchParams` come Promise in Next.js 15 ❌/✅

```tsx
// ❌ SBAGLIATO: sintassi Next.js 14 — searchParams.conv è undefined in v15
export default function ChatPage({ searchParams }: { searchParams: { conv?: string } }) {
  const conv = searchParams.conv  // undefined! è una Promise
}
```

```tsx
// ✅ CORRETTO (chat/page.tsx del progetto)
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conv?: string }>
}) {
  const { conv } = await searchParams  // await obbligatorio
}
```

---

### 5. Server Action error handling ❌/✅

```typescript
// ❌ SBAGLIATO: eccezione Prisma non gestita → dettagli DB esposti al client
export async function sendMessage(data) {
  'use server'
  const message = await prisma.message.create({ data })  // può lanciare!
  revalidatePath('/chat')
  return { message }
}
```

```typescript
// ✅ CORRETTO: validazione Zod + try/catch + messaggio generico al client
export async function sendMessage(data: unknown) {
  'use server'
  const parsed = SendMessageSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  try {
    const message = await prisma.message.create({ data: parsed.data })
    revalidatePath('/chat')
    return { message }
  } catch (e) {
    console.error('[sendMessage] DB error:', e)
    return { error: 'Impossibile inviare il messaggio' }  // mai i dettagli Prisma
  }
}
```

---

### 6. Tailwind v4 — sintassi `@import` ❌/✅

```css
/* ❌ SBAGLIATO: sintassi Tailwind v3 — non funziona con v4 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```css
/* ✅ CORRETTO (globals.css del progetto) */
@import 'tailwindcss';

@theme {
  --color-primary: #3b82f6;  /* design token via CSS custom property */
}
```

---

### 7. `revalidatePath` scope ❌/✅

```typescript
// ❌ ECCESSIVO: invalida tutta l'app ad ogni messaggio
revalidatePath('/', 'layout')

// ✅ CORRETTO (messages.ts del progetto)
revalidatePath('/chat')  // invalida solo /chat e segmenti figli

// Per granularità finer: usare revalidateTag
revalidateTag('messages')  // richiede fetch({ next: { tags: ['messages'] } })
```

---

### 8. `useCallback` per dipendenze WebSocket stabili ❌/✅

```tsx
// ❌ SBAGLIATO: callback ricreata ad ogni render → disconnect/reconnect loop
const { status } = useWebSocket({
  conversationId: activeId,
  onMessage: (msg) => { setLiveMessages(prev => [...prev, msg]) }  // nuova funzione ogni render!
})
```

```tsx
// ✅ CORRETTO (ChatLayout.tsx del progetto)
const handleWsMessage = useCallback((msg: WsMessageType) => {
  if (msg.type === 'chat') {
    setLiveMessages((prev) => [...prev, msg.payload.message])
  }
}, [])  // identità stabile tra render

const { status, sendMessage } = useWebSocket({
  conversationId: activeId,
  onMessage: handleWsMessage,  // riferimento stabile → nessun reconnect spurio
})
```

---

## 9. Confronto con Angular

### Tabella comparativa

| Criterio | Next.js 15 | Angular 21 | Vincitore |
|---|---|---|---|
| **SSR approach** | RSC + App Router; fetch nativo con cache semantics; PPR sperimentale | `@angular/ssr` + Express (`AngularNodeAppEngine`); `RenderMode.Prerender` | **Pari** — entrambi funzionanti; Angular più esplicito, Next.js più integrato |
| **Real-time WebSocket** | WS server separato + `useWebSocket` hook + Zustand state | Da implementare: nessun WebSocket nel branch corrente | **Next.js** — stack WS già implementato e funzionante |
| **Routing** | File-based (`app/`), layout annidati nativi, `Link` con prefetch | Config-based in `app.routes.ts`; `<a href>` nel codice (no `routerLink`) | **Next.js** — zero config, navigazione SPA corretta |
| **Data fetching** | RSC `fetch` + Server Actions + TanStack Query v5 (49.7M dw/w) | `HttpClient` + RxJS Observables, nessun caching built-in | **Next.js** — stack RSC + TanStack Query più maturo |
| **TypeScript** | Ottimo: inference Server Actions, strict mode, nessun decorator | Eccellente: native-first, decoratori type-safe, DI completamente tipizzata | **Angular** — TypeScript first-class dall'origine; DI superiore |
| **Bundle size** | ~80–120 KB baseline; RSC = zero JS per componenti server-only | ~200–350 KB framework overhead (zone.js incluso) | **Next.js** — RSC riduce significativamente il JS client |
| **State management** | Zustand (32M dw/w) per UI state; TanStack Query per server state | NgRx (verboso) o Signals (in maturazione); nessun equivalente zero-boilerplate | **Next.js** — Zustand è il sweet spot DX/potenza |
| **Animazioni** | Framer Motion v12 (40M dw/w); `AnimatePresence`, layout animations | `@angular/animations` built-in; meno intuitivo per microinterazioni | **Next.js** — Framer Motion è lo standard industry |
| **Forms** | React Hook Form + Zod; zero re-render; integrazione shadcn/ui | `ReactiveFormsModule` nativo, robusto, typed forms (Angular 14+) | **Angular** — superiore per form enterprise complessi |
| **Testing** | Vitest + React Testing Library; più veloci, meno boilerplate | Jest + TestBed (più verboso); test `app.spec.ts` già desallineato | **Next.js** — Vitest + RTL più veloci |
| **Deploy** | Vercel zero-config; Docker; Cloudflare; AWS; Aspire `AddNpmApp` | Qualsiasi Node/CDN/nginx; Docker; portabilità totale | **Angular** — nessun vendor lock-in |
| **Vendor lock-in** | ⚠️ Alcune feature ottimizzate solo su Vercel | ✅ Nessun lock-in; Google supporta senza cloud proprietario | **Angular** — vantaggio in contesti enterprise |
| **Community (npm/week)** | ~11.2M (+28% YoY) | ~4.5M (+5% YoY) | **Next.js** — 2.5× più download, crescita 5.6× più rapida |
| **Enterprise fit** | Flessibile, meno garanzie architetturali per team grandi | DI nativa, architettura rigida, ottimo per team grandi e progetti decennali | **Angular** — superiore per contesti enterprise strutturati |

### Score card

| Categoria | Peso | Next.js 15 | Angular 21 | Note |
|---|---|---|---|---|
| **SSR** | 25% | **8.0/10** | 7.5/10 | Next.js: RSC riduce JS client; Angular: config esplicita ma `RenderMode.Prerender` su `**` non ottimale per chat |
| **Real-time** | 20% | **8.5/10** | 6.0/10 | Next.js: WS implementato + AnimatePresence; Angular: parte da zero nel branch |
| **DX** | 20% | **8.0/10** | 6.5/10 | Next.js: file-based routing, zero config; Angular: pitfall già presenti (link href, test desallineato) |
| **Community** | 15% | **9.0/10** | 7.0/10 | Next.js: 11.2M dw/w, 64.2% admired; Angular: 4.5M dw/w, 53.4% admired |
| **Librerie** | 10% | **9.0/10** | 7.0/10 | Next.js: ecosistema React il più ricco; Angular: librerie di qualità ma più limitate |
| **Enterprise fit** | 10% | 7.0/10 | **8.5/10** | Angular: DI nativa, typed forms, architettura opinionata superiore per team grandi |
| **Totale ponderato** | 100% | **8.25/10** | **6.98/10** | Delta: +1.27 punti a favore di Next.js |

```
Next.js:  (8.0×0.25) + (8.5×0.20) + (8.0×0.20) + (9.0×0.15) + (9.0×0.10) + (7.0×0.10) = 8.25
Angular:  (7.5×0.25) + (6.0×0.20) + (6.5×0.20) + (7.0×0.15) + (7.0×0.10) + (8.5×0.10) = 6.98
```

**Raccomandazione**: Next.js 15 è il candidato raccomandato per questo progetto. L'applicazione è una chat real-time con focus su UX animata e messaggistica live — esattamente il punto di forza dell'ecosistema React/Next.js. Il branch Angular ha pitfall non risolti che ridurrebbero la qualità della demo; il branch Next.js ha il WebSocket già implementato e le librerie già integrate.

---

## 10. Community & Trend

### npm Downloads (settimanali, aprile 2025)

| Framework | Downloads/week | Crescita YoY | Note |
|---|---|---|---|
| `react` | ~50M | +8% | UI library base |
| **`next`** | **~11.2M** | **+28%** | Cresce 3.5× più veloce di React |
| `vue` | ~7M | +12% | Forte in Asia e EU |
| `@angular/core` | ~4.5M | +5% | Stabile, enterprise-driven |
| `nuxt` | ~3.1M | +35% | Meta-framework Vue |
| `astro` | ~1.9M | +85% | Crescita esplosiva da base piccola |
| `remix` | ~1.1M | +22% | Acquisito da Shopify |

**Insight**: Next.js è dove si concentra il nuovo sviluppo React. Il delta +28% vs +8% di React puro conferma che è la scelta di default per i nuovi progetti.

### Developer Surveys

**Stack Overflow 2024** (65.437 rispondenti):

| Framework | Utilizzo | Admired |
|---|---|---|
| React | 39.5% | 62.2% |
| **Next.js** | **17.9% (#4 assoluto)** | **64.2%** |
| Angular | 17.1% (#6 assoluto) | 53.4% |
| Vue.js | 15.4% | 59.5% |

Next.js supera Angular sia in utilizzo (17.9% vs 17.1%) che in soddisfazione (64.2% vs 53.4%).

**State of JS 2024**:

| Meta-Framework | Utilizzo | Retention | Trend |
|---|---|---|---|
| **Next.js** | **#1 (dominante)** | ~74% | In lieve calo |
| SvelteKit | Growing | **~93%** | Top satisfaction |
| Astro | Growing | **~90%** | In forte crescita |
| Remix | Medium | ~72% | Stabile |
| Nuxt | High | ~71% | Stabile |

**Dato critico**: Next.js ha il gap utilizzo/soddisfazione più ampio della categoria. Astro supera Next.js in soddisfazione di 39 punti percentuali. Rimane nel quadrante ADOPT ma con segnali di deterioramento del sentiment.

### Job Market

| Framework | Quota job offers | Trend |
|---|---|---|
| React (incl. Next.js) | ~52% | Stabile/crescita |
| Angular | ~36% | Lieve declino |
| Vue | ~10% | Stabile |

- Domanda Next.js: **+35–60% YoY** (2024 vs 2023)
- Domanda Angular: **-10% YoY**
- Salario medio Next.js developer: $110–125K/anno (US)

### Adozione aziendale

| Azienda | Settore |
|---|---|
| OpenAI (ChatGPT) | AI |
| Notion | SaaS/Produttività |
| TikTok | Social/Media |
| Vercel | Infrastruttura |
| Stripe | FinTech |
| Nike | E-commerce |
| GitHub (Copilot UI) | DevTools |
| Hulu | Streaming |

### Critiche note

1. **Vendor lock-in con Vercel**: features Edge Runtime, ISR ottimizzato e `@vercel/og` funzionano meglio su Vercel. Build Adapters API in alpha per migliorare la portabilità.
2. **App Router complessità**: confini server/client considerati confusi, full page re-mount durante la navigazione, cache behavior opaco.
3. **Breaking changes frequenti**: ogni major version porta migrazioni significative (v14→v15: searchParams come Promise, caching semantics rivoluzionate).
4. **Satisfaction in calo**: State of JS 2024 registra il gap utilizzo/soddisfazione più ampio tra i meta-framework.

### Verdetto sintetico

Next.js rimane la scelta de-facto per applicazioni React con SSR/SSG/ISR. Il dominio è indiscutibile per numero di download e mercato del lavoro. I segnali di soddisfazione in calo sono reali ma non tali da mettere in discussione la scelta per un progetto chat di nuova generazione: l'ecosistema (Zustand, TanStack Query, Framer Motion, shadcn/ui) è il più ricco e maturo disponibile nel 2025.
