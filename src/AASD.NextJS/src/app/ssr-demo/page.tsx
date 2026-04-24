import type { Metadata } from 'next'
import { getUsersFromBackend, getConversationsFromBackend } from '@/lib/backend'
import { ServerRenderBadge } from '@/components/ui/RenderBadge'
import { EvalSection } from '@/components/eval/EvalSection'
import { CodeBlock } from '@/components/eval/CodeBlock'
import { ServerDataCard } from '@/components/eval/ServerDataCard'

export const metadata: Metadata = { title: 'Next.js Evaluation' }

// ─── Code snippets (real code from this app) ──────────────────────────────────

const RSC_SNIPPET = `// src/app/ssr-demo/page.tsx
// Questo stesso file — RSC async, zero bundle JS per questo fetch
export default async function SsrDemoPage() {
  const [users, conversations] = await Promise.all([
    getUsersFromBackend(),           // fetch diretto al backend, no useEffect
    getConversationsFromBackend(),   // eseguito sul server prima di inviare HTML
  ])
  const renderTime = new Date().toISOString()  // timestamp frozen sul server

  return <ServerDataCard users={users} conversations={conversations} renderTime={renderTime} />
}`

const SIGNALR_SNIPPET = `// src/hooks/useWebSocket.ts
const connection = new HubConnectionBuilder()
  .withUrl(getBackendHubUrl(), {
    transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
    withCredentials: false,           // richiesto da AllowAnyOrigin() CORS policy
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000])  // exponential-like backoff
  .configureLogging(LogLevel.Warning)
  .build()

// Hub URL derivato runtime da NEXT_PUBLIC_BACKEND_API_URL
// Mai hardcoded — Aspire inietta il valore corretto

connection.on('ReceiveMessage', (message: MessageWithSender) => {
  onMessage({ type: 'chat', payload: { conversationId: message.conversationId, message } })
})

// Cleanup: LeaveConversation invocato nel return dell'useEffect
return () => {
  void connection.invoke('LeaveConversation', conversationId).then(() => connection.stop())
}`

const LIFECYCLE_SNIPPET = `// ── RSC: fetcha dati, zero JS al browser ────────────────────────────────────
// src/app/chat/page.tsx
export default async function ChatPage({ searchParams }) {
  const conversations = await getConversations()  // Server Action
  return (
    <ChatLayout                         // ↓ RSC→Client boundary
      conversations={conversations}     // dati serializzati via React Flight Protocol
      activeConversationId={conv}
    />
  )
}

// ── Client Component: stato interattivo + SignalR lifecycle ──────────────────
// src/components/chat/ChatLayout.tsx
'use client'
export default function ChatLayout({ conversations, activeConversationId }) {
  const [activeId, setActiveId] = useState(activeConversationId)
  const [liveMessages, setLiveMessages] = useState([])

  const { status } = useWebSocket({     // SignalR lifecycle nel client
    conversationId: activeId,
    userId: activeSenderId,
    onMessage: handleWsMessage,
  })

  return <ConversationList conversations={conversations} />
}`

const ZUSTAND_SNIPPET = `// src/lib/store.ts — Zustand 5 store
interface ChatState {
  activeSenderId: string | null          // quale utente sta scrivendo
  unreadCounts: Record<string, number>   // badge non letti per conversazione
  wsStatus: RealtimeStatus               // stato connessione SignalR
  wsStatusHistory: RealtimeStatusEntry[] // ultimi 10 cambi di stato
}

export const useChatStore = create<ChatState>()(
  devtools((set) => ({
    activeSenderId: null,
    setActiveSenderId: (id) => set({ activeSenderId: id }),
    unreadCounts: {},
    incrementUnread: (convId) => set((s) => ({
      unreadCounts: { ...s.unreadCounts, [convId]: (s.unreadCounts[convId] ?? 0) + 1 },
    })),
    clearUnread: (convId) => set((s) => ({
      unreadCounts: { ...s.unreadCounts, [convId]: 0 },
    })),
  }), { name: 'ChatStore' })
)`

const REACT_QUERY_SNIPPET = `// src/components/chat/ConversationList.tsx
// React Query polls ogni 5s; initialData da SSR evita flash di loading
const { data: conversations } = useQuery({
  queryKey: ['conversations'],
  queryFn: () => getConversations(),
  initialData: initialConversations,  // ← dati già fetchati dal RSC parent
  refetchInterval: 5_000,             // polling silenzioso in background
  refetchOnWindowFocus: true,
  staleTime: 4_000,
})
// Nessuno spinner visibile — initialData riempie subito la lista`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SsrDemoPage() {
  const [users, conversations] = await Promise.all([
    getUsersFromBackend().catch(() => []),
    getConversationsFromBackend().catch(() => []),
  ])
  const renderTime = new Date().toISOString()

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-text">Next.js 15 Evaluation</h1>
          <ServerRenderBadge label="RSC · questa pagina" />
        </div>
        <p className="text-text-muted text-lg">
          Analisi tecnica delle funzionalità chiave di Next.js 15 con App Router,
          con esempi di codice reali estratti da questa applicazione.
        </p>

        {/* Quick-nav */}
        <nav className="flex flex-wrap gap-2 pt-1" aria-label="Page sections">
          {[
            { href: '#rsc', label: 'RSC', color: 'text-emerald-700 dark:text-emerald-400' },
            { href: '#realtime', label: 'SignalR', color: 'text-blue-700 dark:text-blue-400' },
            { href: '#lifecycle', label: 'Lifecycle', color: 'text-purple-700 dark:text-purple-400' },
            { href: '#libraries', label: 'Librerie', color: 'text-orange-700 dark:text-orange-400' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium hover:underline ${item.color}`}
            >
              {item.label} ↓
            </a>
          ))}
        </nav>
      </div>

      {/* Section 1 — RSC */}
      <EvalSection
        id="rsc"
        title="React Server Components"
        badge="RSC"
        badgeColor="green"
        description="I RSC vengono eseguiti esclusivamente sul server. Zero JS inviato al browser per il fetch, accesso diretto alle variabili d'ambiente server-side, nessun useEffect, nessun loading spinner iniziale."
      >
        <ServerDataCard users={users} conversations={conversations} renderTime={renderTime} />
        <CodeBlock filename="app/ssr-demo/page.tsx" language="tsx" code={RSC_SNIPPET} />
      </EvalSection>

      {/* Section 2 — SignalR */}
      <EvalSection
        id="realtime"
        title="Real-time con SignalR"
        badge="Client"
        badgeColor="blue"
        description="SignalR (@microsoft/signalr) gestisce WebSocket con fallback automatico a Long Polling. La connessione al hub vive in un custom hook React con reconnect esponenziale e cleanup garantito nel return dell'useEffect."
      >
        <CodeBlock filename="hooks/useWebSocket.ts" language="tsx" code={SIGNALR_SNIPPET} />
      </EvalSection>

      {/* Section 3 — Lifecycle */}
      <EvalSection
        id="lifecycle"
        title="Component Lifecycle — RSC vs Client"
        badge="Hybrid"
        badgeColor="purple"
        description="Next.js 15 introduce un confine netto: RSC per il fetch iniziale dei dati (zero JS al browser), Client Components per stato interattivo e side effects. Il pattern canonico è: RSC fetcha → serializza via React Flight Protocol → Client Component gestisce l'interazione."
      >
        <CodeBlock filename="app/chat/page.tsx + ChatLayout.tsx" language="tsx" code={LIFECYCLE_SNIPPET} />
      </EvalSection>

      {/* Section 4 — Libraries */}
      <EvalSection
        id="libraries"
        title="Librerie: Zustand + React Query"
        badge="Client"
        badgeColor="orange"
        description="Zustand 5 gestisce lo stato globale UI (sender attivo, contatori unread, stato SignalR). React Query 5 si occupa del fetching lato client con caching, polling e invalidazione — inizializzato con i dati già fetchati dal RSC parent per evitare flash di loading."
      >
        <CodeBlock filename="lib/store.ts" language="tsx" code={ZUSTAND_SNIPPET} />
        <CodeBlock filename="components/chat/ConversationList.tsx" language="tsx" code={REACT_QUERY_SNIPPET} />
      </EvalSection>
    </div>
  )
}
