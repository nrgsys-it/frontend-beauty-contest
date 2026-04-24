import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

const WS_PORT = parseInt(process.env.WS_PORT || '3002', 10)

interface JoinMessage {
  type: 'join'
  payload: {
    conversationId: string
    userId?: string
  }
}

interface LeaveMessage {
  type: 'leave'
  payload: {
    conversationId: string
    userId?: string
  }
}

interface ChatMessage {
  type: 'chat'
  payload: {
    conversationId: string
    message: unknown
  }
}

interface PingMessage {
  type: 'ping'
}

interface CreateConversationMessage {
  type: 'createConversation'
  payload: {
    conversationId: string
    createdBy?: string
    title?: string
  }
}

type IncomingWsMessage =
  | JoinMessage
  | LeaveMessage
  | ChatMessage
  | PingMessage
  | CreateConversationMessage

interface JoinedServerMessage {
  type: 'joined'
  payload: {
    conversationId: string
  }
}

interface LeftServerMessage {
  type: 'left'
  payload: {
    conversationId: string
  }
}

interface PongServerMessage {
  type: 'pong'
}

interface ErrorServerMessage {
  type: 'error'
  payload: {
    message: string
  }
}

type OutgoingWsMessage =
  | JoinedServerMessage
  | LeftServerMessage
  | PongServerMessage
  | ErrorServerMessage
  | CreateConversationMessage

// Room management: conversationId -> Set of WebSocket clients
const rooms = new Map<string, Set<WebSocket>>()
const clients = new Set<WebSocket>()

function timestamp() {
  return new Date().toISOString()
}

function logInfo(message: string) {
  console.log(`[${timestamp()}] [WS] ${message}`)
}

function logError(message: string, error?: unknown) {
  console.error(`[${timestamp()}] [WS] ${message}`, error)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sendToClient(ws: WebSocket, message: OutgoingWsMessage) {
  ws.send(JSON.stringify(message))
}

function joinRoom(conversationId: string, ws: WebSocket) {
  if (!rooms.has(conversationId)) {
    rooms.set(conversationId, new Set())
  }
  rooms.get(conversationId)!.add(ws)
  logInfo(`Client joined room ${conversationId}. Room size: ${rooms.get(conversationId)!.size}`)
}

function leaveRoom(conversationId: string, ws: WebSocket) {
  if (!rooms.has(conversationId)) return
  const room = rooms.get(conversationId)!
  room.delete(ws)
  if (room.size === 0) {
    rooms.delete(conversationId)
  }
  logInfo(`Client left room ${conversationId}. Room size: ${room.size}`)
}

function leaveAllRooms(ws: WebSocket) {
  for (const [roomId, clients] of rooms.entries()) {
    clients.delete(ws)
    if (clients.size === 0) rooms.delete(roomId)
  }
}

function broadcast(conversationId: string, data: string, exclude?: WebSocket) {
  const room = rooms.get(conversationId)
  if (!room) return
  let count = 0
  for (const client of room) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data)
      count++
    }
  }
  logInfo(`Broadcast to room ${conversationId}: ${count} clients`)
}

function broadcastAll(data: string, exclude?: WebSocket) {
  let count = 0
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data)
      count++
    }
  }
  logInfo(`Broadcast to all clients: ${count} recipients`)
}

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size, port: WS_PORT }))
    return
  }
  res.writeHead(404)
  res.end()
})

const wss = new WebSocketServer({ server, path: '/chat' })

wss.on('connection', (ws, req) => {
  clients.add(ws)
  logInfo(`New connection from ${req.socket.remoteAddress}. Connected clients: ${clients.size}`)

  ws.on('message', (raw) => {
    try {
      const parsed: unknown = JSON.parse(raw.toString())
      if (!isRecord(parsed) || typeof parsed.type !== 'string') {
        sendToClient(ws, { type: 'error', payload: { message: 'Invalid message shape' } })
        return
      }

      const msg = parsed as { type: IncomingWsMessage['type']; payload?: unknown }

      switch (msg.type) {
        case 'join': {
          if (!isRecord(msg.payload) || typeof msg.payload.conversationId !== 'string') {
            sendToClient(ws, { type: 'error', payload: { message: 'Missing conversationId in join payload' } })
            return
          }
          joinRoom(msg.payload.conversationId, ws)
          sendToClient(ws, { type: 'joined', payload: { conversationId: msg.payload.conversationId } })
          break
        }

        case 'leave': {
          if (!isRecord(msg.payload) || typeof msg.payload.conversationId !== 'string') {
            sendToClient(ws, { type: 'error', payload: { message: 'Missing conversationId in leave payload' } })
            return
          }
          leaveRoom(msg.payload.conversationId, ws)
          sendToClient(ws, { type: 'left', payload: { conversationId: msg.payload.conversationId } })
          break
        }

        case 'chat': {
          if (!isRecord(msg.payload) || typeof msg.payload.conversationId !== 'string') {
            sendToClient(ws, { type: 'error', payload: { message: 'Missing conversationId in chat payload' } })
            return
          }
          logInfo(`Chat message received for room ${msg.payload.conversationId}`)
          broadcast(msg.payload.conversationId, JSON.stringify(msg))
          break
        }

        case 'createConversation': {
          if (!isRecord(msg.payload) || typeof msg.payload.conversationId !== 'string') {
            sendToClient(ws, { type: 'error', payload: { message: 'Missing conversationId in createConversation payload' } })
            return
          }
          logInfo(`Conversation created: ${msg.payload.conversationId}`)
          broadcastAll(JSON.stringify(msg), ws)
          break
        }

        case 'ping':
          sendToClient(ws, { type: 'pong' })
          break

        default:
          sendToClient(ws, { type: 'error', payload: { message: `Unknown type: ${msg.type}` } })
      }
    } catch (e) {
      logError('Parse error', e)
      sendToClient(ws, { type: 'error', payload: { message: 'Invalid JSON' } })
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
    leaveAllRooms(ws)
    logInfo(`Client disconnected. Connected clients: ${clients.size}`)
  })

  ws.on('error', (err) => {
    clients.delete(ws)
    logError('Client socket error', err)
    leaveAllRooms(ws)
  })
})

server.listen(WS_PORT, () => {
  logInfo(`WebSocket server running on ws://localhost:${WS_PORT}/chat`)
  logInfo(`Health check: http://localhost:${WS_PORT}/health`)
})
