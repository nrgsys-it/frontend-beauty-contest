import type {
  ConversationWithLastMessage,
  MessageWithSender,
  UserSummary,
} from '@/lib/types'

const DEFAULT_BACKEND_API_URL = 'http://localhost:5208'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function getBackendApiUrl() {
  if (typeof window === 'undefined') {
    return trimTrailingSlash(
      process.env.BACKEND_API_URL ??
        process.env.NEXT_PUBLIC_BACKEND_API_URL ??
        DEFAULT_BACKEND_API_URL,
    )
  }

  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL,
  )
}

export function getBackendHubUrl() {
  const explicitHubUrl = process.env.NEXT_PUBLIC_BACKEND_HUB_URL
  if (explicitHubUrl) {
    return trimTrailingSlash(explicitHubUrl)
  }

  return `${getBackendApiUrl()}/chat-hub`
}

interface ApiProblemDetails {
  detail?: string
  errors?: string[]
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as ApiProblemDetails
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors.join(' ')
    }

    if (payload.detail) {
      return payload.detail
    }
  } catch {
    // Ignore JSON parsing errors and return fallback below.
  }

  return `Backend request failed with status ${response.status}.`
}

export async function backendRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getBackendApiUrl()}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as T
}

export async function getUsersFromBackend() {
  try {
    return await backendRequest<UserSummary[]>('/api/users')
  } catch {
    return []
  }
}

export async function getMessagesFromBackend(conversationId: string) {
  try {
    return await backendRequest<MessageWithSender[]>(
      `/api/conversations/${conversationId}/messages`,
    )
  } catch {
    return []
  }
}

type BackendConversation = Omit<ConversationWithLastMessage, 'messages'>

export async function getConversationsFromBackend() {
  let conversations: BackendConversation[] = []

  try {
    conversations = await backendRequest<BackendConversation[]>('/api/conversations')
  } catch {
    return []
  }

  const latestMessages = await Promise.all(
    conversations.map(async (conversation) => {
      const messages = await getMessagesFromBackend(conversation.id)
      return messages[messages.length - 1] ?? null
    }),
  )

  return conversations.map((conversation, index) => {
    const lastMessage = latestMessages[index]
    return {
      ...conversation,
      messages: lastMessage ? [lastMessage] : [],
    }
  })
}
