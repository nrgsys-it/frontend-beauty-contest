## Topic
How to add MongoDB-backed chat message persistence to the current Angular SSR + Aspire app, including message storage, retrieval, read/unread tracking, and incremental loading while scrolling upward.

## Context
- The current AppHost in `src/AASD.Orchestration/AppHost.cs` orchestrates Angular and PostgreSQL only; MongoDB is not yet modeled.
- The Angular SSR server already exposes Express API endpoints in `src/AASD.Angular/src/server.ts`, so message APIs can live there without adding a separate backend immediately.
- `ChatPage` in `src/AASD.Angular/src/app/components/chat-page/chat-page.ts` currently keeps sent messages only in memory via `sentMessages: string[]`.
- Conversations are fetched via Express -> Prisma -> PostgreSQL; `src/AASD.Angular/src/server/gateways/conversationGateway.ts` filters conversations by selected user.
- The current Prisma schema models `User` -> `Conversation` as one-to-many rather than true many-to-many, so participant modeling is still immature.
- Because the app already uses SSR and per-user selection state, any message design needs to work both for server APIs and client incremental loading.

## Ideas
1. **Name**: Mongo as message store, Postgres as conversation directory
   - **Description**: Keep users and conversations in PostgreSQL/Prisma for relational membership and metadata, but store chat messages in MongoDB. Each conversation gets its own message stream in Mongo, keyed by `conversationId`, while Postgres remains the source of truth for who can see that conversation.
   - **Why it could work**: It fits the current architecture with minimal disruption: Prisma stays for user/conversation lookup, Mongo handles append-heavy message history efficiently.
   - **Risk / caveat**: It introduces dual persistence, so conversation creation and message creation become cross-database workflows.

2. **Name**: Full chat domain in Mongo, auth/directory in Postgres
   - **Description**: Move conversation membership, last message preview, unread counters, and messages into Mongo collections. Postgres remains only for app users and perhaps login/selection logic.
   - **Why it could work**: It gives a coherent document model for the whole chat subsystem and simplifies message queries and unread aggregation.
   - **Risk / caveat**: It duplicates or shifts responsibility away from the current Prisma conversation model and likely requires a migration in thinking and code.

3. **Name**: Conversation document + message collection hybrid
   - **Description**: Store one `conversations` collection with participant ids, last message snapshot, and per-user read cursors; store all historical messages in a separate `messages` collection. Reads for the sidebar hit `conversations`; opening a chat hits `messages` with cursor pagination.
   - **Why it could work**: It balances denormalized fast conversation lists with scalable message history loading.
   - **Risk / caveat**: Requires careful consistency updates when sending a message because both collections change.

4. **Name**: Embed recent messages in conversation, archive full history separately
   - **Description**: Keep the last N messages embedded in each conversation document for instant render, and also write every message to a full `messages` collection. The client first sees recent messages from the conversation doc, then older pages from the archive collection.
   - **Why it could work**: Very fast first paint for active chats and efficient sidebar previews.
   - **Risk / caveat**: More write amplification and more complex synchronization logic than a plain message collection.

5. **Name**: Message-centric collection with read events collection
   - **Description**: Use a `messages` collection for the stream and a separate `readReceipts` or `conversationReads` collection keyed by `(conversationId, userId)`. A user's unread state is derived by comparing the last read cursor/timestamp against message sequence or creation time.
   - **Why it could work**: This avoids updating many message documents when marking a conversation read.
   - **Risk / caveat**: Unread counts become a query problem unless some counters are cached or denormalized.

6. **Name**: Materialized unread counters per conversation member
   - **Description**: Keep an unread counter map per conversation, for example `unreadByUserId`, updated transactionally-ish on send/read operations. Message reads update the cursor and reset or decrement the counter.
   - **Why it could work**: Sidebar unread badges become O(1) to fetch.
   - **Risk / caveat**: Counter drift is possible if updates fail midway, so reconciliation logic may be needed.

7. **Name**: Monotonic sequence numbers for stable pagination and read tracking
   - **Description**: Instead of relying only on timestamps, assign each message a per-conversation incremental sequence number (`seq`). Use `seq` for pagination, last-read tracking, and unread count computation.
   - **Why it could work**: It makes ordering, cursoring, and "everything after X" queries simpler and safer than purely timestamp-based logic.
   - **Risk / caveat**: Requires a safe way to allocate sequence numbers per conversation.

8. **Name**: Cursor-based upward infinite scroll
   - **Description**: Load the most recent page first, then as the user scrolls upward request older messages using a cursor such as `beforeMessageId`, `beforeSeq`, or `beforeCreatedAt`. The API returns `items`, `nextCursor`, and `hasMore`.
   - **Why it could work**: This is the most scalable way to support chat history and avoids offset pagination issues.
   - **Risk / caveat**: The client must maintain stable scroll anchoring when prepending older messages.

9. **Name**: Read state as "last seen message" rather than per-message booleans
   - **Description**: For each `(conversationId, userId)`, store `lastReadMessageId` or `lastReadSeq`, plus `lastReadAt`. All older messages are implicitly read; all newer non-self messages are unread.
   - **Why it could work**: Much cheaper than updating every message document when a user reads a chat.
   - **Risk / caveat**: If you need WhatsApp-like per-message read receipts for all participants, you may still need some extra detail model.

10. **Name**: Server-side APIs grouped by message lifecycle
   - **Description**: Model APIs around clear operations: `GET /api/conversations/:id/messages?before=...`, `POST /api/conversations/:id/messages`, `POST /api/conversations/:id/read`, `GET /api/conversations/:id/unread-summary`. Keep `ChatPage` as a thin client over these endpoints.
   - **Why it could work**: It matches the current Express SSR gateway style and keeps Angular free of direct DB concerns.
   - **Risk / caveat**: Without realtime transport, newly arriving messages still need polling or refresh.

11. **Name**: Polling first, realtime later
   - **Description**: Start with durable Mongo persistence plus periodic polling for new messages and unread counts. Defer WebSocket/SSE until the data model is stable.
   - **Why it could work**: It reduces moving parts and lets the team settle schema and read-state semantics first.
   - **Risk / caveat**: UX is weaker than live push and may feel laggy.

12. **Name**: Conversation snapshot for fast chat list
   - **Description**: Denormalize into each conversation document a `lastMessage` subdocument, `lastMessageAt`, and per-user unread summary. The chat list never scans the message collection.
   - **Why it could work**: Sidebar conversation loading stays fast even with a very large message history.
   - **Risk / caveat**: Requires disciplined writes to keep snapshots consistent with the actual latest message.

## Themes & Groupings
- **Persistence topology**: ideas 1, 2, 3, 4
- **Read/unread modeling**: ideas 5, 6, 9
- **Pagination/loading**: ideas 7, 8, 12
- **Delivery strategy**: ideas 10, 11

## Top Directions
1. **Mongo only for messages; keep conversations/users in Postgres**
   - Best fit with the current codebase because it extends rather than replaces the existing Prisma-based conversation lookup.

2. **Use `conversations` + `messages` + per-user read cursor**
   - Strong middle ground: fast conversation lists, scalable message history, and cheap unread tracking without mutating every message on read.

3. **Adopt cursor-based loading from the start**
   - Chat history is the classic place where offset pagination becomes painful; using `beforeMessageId` or `beforeSeq` early avoids redesign later.

4. **Store read state as `lastReadMessageId` / `lastReadSeq` per user per conversation**
   - This is the simplest durable model for read/unread that still scales and supports badges, "mark as read", and lazy unread calculation.

## Open Questions
- Should MongoDB store only messages, or should it also become the source of truth for conversation membership and unread metadata?
- Do you want direct messages only, or also group conversations? That strongly affects the participant model.
- Is the current Prisma conversation schema temporary? Right now it does not naturally support a user participating in many conversations.
- Do you need hard realtime delivery now, or is polling acceptable for the first iteration?
- Should unread semantics be conversation-level only, or do you eventually want per-message read receipts per participant?
- Is message editing/deletion in scope? If yes, the message document model should reserve fields for status and audit timestamps.
- Should the first loaded page show only the latest N messages, or should it anchor around unread boundaries when the user reopens a conversation?

## Refined Direction
- **Conversation ownership stays in PostgreSQL/Prisma**
  - Preserve `User` and `Conversation` in Postgres as the source of truth for who is allowed to access a 1:1 chat.
  - MongoDB should store message history and unread state support data, not replace the conversation directory.
- **Chat scope is 1:1 only**
  - Each Mongo message document can assume exactly one `conversationId`, one `senderId`, and at most two participants implied by the Postgres conversation.
  - This removes the need for a generalized participant array model in the first iteration, though keeping `conversationId` as the join key still preserves future flexibility.
- **Unread is tracked at conversation level only**
  - Recommended storage: one read-state document per `(conversationId, userId)` with `lastReadMessageId` or `lastReadSeq`.
  - Optional denormalized unread badge per conversation can be materialized separately for fast list rendering.
- **Polling for new messages is acceptable in v1**
  - The client can poll two things independently: current conversation messages (while chat is open) and conversation badge summaries.
  - This avoids locking the first version into WebSocket/SSE decisions before the persistence model settles.
- **Conversation list needs unread badge, not last message preview**
  - The `conversations` list API can stay narrow: conversation id, title, and unread count for the current user.
  - `lastMessage` denormalization becomes optional rather than required for the first version.

## Refined Recommended Shape
- **Postgres / Prisma**
  - Keep `User` and `Conversation` authoritative.
  - Ensure the 1:1 mapping semantics are explicit enough to answer: "which conversation belongs to this user pair?"
- **Mongo `messages` collection**
  - `_id`
  - `conversationId` (string, matching Postgres conversation id)
  - `senderId`
  - `seq` (preferred) or `createdAt` as cursor field
  - `body`
  - `createdAt`
  - optional `editedAt`, `deletedAt`
- **Mongo `conversationReads` collection**
  - `_id`
  - `conversationId`
  - `userId`
  - `lastReadMessageId` or `lastReadSeq`
  - `lastReadAt`
- **Optional Mongo `conversationUnread` projection**
  - `_id`
  - `conversationId`
  - `userId`
  - `unreadCount`
  - `updatedAt`
  - Useful only if badge computation becomes too expensive to derive on demand.

## Refined Load / Save Flow
- **Send message**
  - Validate in Postgres that sender belongs to the conversation.
  - Insert message into Mongo `messages`.
  - Update unread state for the other user only.
- **Open conversation**
  - Load latest N messages from Mongo by `conversationId`, ordered descending, then reverse for UI.
  - Mark conversation as read for the active user by updating `conversationReads`.
- **Scroll upward**
  - Request older messages with `beforeSeq` or `beforeMessageId`.
  - Prepend results and keep scroll anchored.
- **Polling**
  - Poll the active conversation for messages newer than latest loaded cursor.
  - Poll the conversation list for unread badge counts on a slower cadence.

## Refined Top Directions
1. **Postgres for conversations, Mongo for messages**
   - Best match for the constraints you chose: preserve current relational conversation model while moving only the append-heavy history into Mongo.

2. **Unread via per-user conversation read cursor**
   - Best fit for "badge only" unread semantics; avoids per-message read flags and scales cleanly for 1:1 chat.

3. **Initial load latest page + upward cursor pagination + polling for new messages**
   - Cleanest v1 delivery model: simple mental model, scalable history loading, and no realtime infrastructure yet.

## Alternative User-Scoped Collection Model
- You proposed a user-scoped storage model where each user owns a personal message collection, e.g. `{userId}-messages`.
- In that shape, each stored message has:
  - `id`
  - `conversation_id` (from Postgres)
  - `senderId` (from Postgres)
  - `seq`
  - `body`
  - `created_at`
  - `edited_at`

### How this model would work
- **Write**
  - User `xxxx` sends a message.
  - The server determines `conversation_id` and the next `seq` for that conversation.
  - The message is written into collection `xxxx-messages`.
- **Read**
  - User `yyyy` opens the conversation with `xxxx`.
  - The system reads the latest 15 messages from `xxxx-messages` for that `conversation_id` (other side).
  - The system reads the latest 15 messages from `yyyy-messages` for that `conversation_id` (my side).
  - The two result sets are merged and sorted by `seq` into a single chat timeline.

### Why this could work
- It keeps the mental model close to "user inbox/outbox" rather than one shared stream.
- It can make per-user deletion/retention rules easier if you later want one side to keep or drop its own chat copy independently.
- It aligns well with a 1:1-only chat domain because every message effectively belongs to one sender-owned stream.

### Main caveats
- **Write duplication pressure appears quickly**: for a durable 1:1 conversation, the receiver often also needs visibility of the sender's message. If only `xxxx-messages` gets the write, then `yyyy` can see the message only by querying the other user's collection, which is unusual and pushes cross-user reads into every fetch.
- **Conversation load becomes a merge problem every time**: every open chat needs at least two Mongo queries plus a merge sort. Pagination upward also becomes more complex because the cursor must remain coherent across two collections.
- **Indexing is more fragmented**: instead of indexing one `messages` collection by `(conversationId, seq)`, you need the same indexes repeated across many collections.
- **Operational overhead grows with user count**: many user-scoped collections are usually harder to reason about, migrate, and observe than one shared collection with strong indexes.
- **Unread later may be harder, not easier**: once you reintroduce unread, you still need per-conversation per-user state, and now the messages themselves are split across collections.

### Best-fit interpretation of your model
- The cleanest version of your idea is to treat Mongo as a pair of per-user message ledgers:
  - `xxxx-messages` = everything user `xxxx` sent
  - `yyyy-messages` = everything user `yyyy` sent
- A conversation is then reconstructed by querying both ledgers with the same `conversation_id` and merging by `seq`.
- This is viable for 1:1 chat if you explicitly accept that the message history is reconstructed dynamically rather than stored as one shared timeline.

### Where I would be cautious
- If you know you will later need:
  - unread badges,
  - efficient "latest N messages",
  - polling for new messages,
  - simpler pagination,
  then a single shared `messages` collection per conversation is operationally simpler.
- If you value the user-owned collection idea because it mirrors sender ownership or future user-local retention, then your model is defensible, but it optimizes for ownership semantics over query simplicity.

### Refined comparison
- **Your model (`{userId}-messages`)**
  - Better for: user-owned ledgers, 1:1-only thinking, possible future asymmetric deletion semantics.
  - Worse for: pagination, polling, unread, operational simplicity.
- **Shared `messages` collection**
  - Better for: timeline reads, pagination, polling, unread counters, indexing.
  - Worse for: modeling message ownership as separate per-user ledgers.

### If your model is chosen
- I would keep Postgres/Prisma as the only source of truth for conversation existence and allowed participants.
- I would still introduce a separate lightweight read-state store later, because unread should not depend on scanning or diffing two collections repeatedly.
- I would define pagination cursors around `seq`, since merging two per-user streams is only stable if `seq` is globally monotonic per conversation.

## Suggested Data Shape
- **`conversations` collection**
  - `_id`
  - `conversationId` (string aligned with Postgres conversation id, if Postgres remains source of truth)
  - `participantIds: string[]`
  - `lastMessage: { _id, senderId, textPreview, sentAt }`
  - `lastMessageAt`
  - optionally `unreadByUserId: { [userId]: number }`
- **`messages` collection**
  - `_id`
  - `conversationId`
  - `senderId`
  - `seq` or `sentAt`
  - `type` (`text`, later `image`, `system`, ...)
  - `body`
  - `createdAt`
  - optional `editedAt`, `deletedAt`
- **`conversationReads` collection**
  - `_id`
  - `conversationId`
  - `userId`
  - `lastReadMessageId` or `lastReadSeq`
  - `lastReadAt`

## How I Would Save the Data
- On send message:
  - validate sender belongs to conversation
  - insert one document into `messages`
  - update the corresponding `conversations` document with `lastMessage` + `lastMessageAt`
  - increment unread counters for all other participants if using denormalized counters
- On mark as read:
  - upsert a `conversationReads` document for `(conversationId, userId)`
  - optionally reset/update the unread counter for that user in the conversation snapshot

## How I Would Retrieve It
- **Conversation list**: query `conversations` for the current user, sorted by `lastMessageAt desc`, returning preview data and unread badge info.
- **Initial chat open**: query `messages` by `conversationId`, sorted descending, limit N; reverse in memory for display.
- **Load older on upward scroll**: query `messages` with `conversationId` and `seq < cursor` (or `createdAt < cursor`) plus `limit N`.
- **Unread badge**: either read `unreadByUserId[userId]` from conversation snapshot or derive it using `conversationReads` + message cursor logic.

## What I Would Track for Read/Unread
- Baseline model: `lastReadMessageId` or `lastReadSeq` per user per conversation.
- Unread messages for a user are every non-self message with sequence greater than last-read.
- If instant badge rendering matters, also keep denormalized unread counters in the conversation snapshot.

## Loading Strategy
- Initial page loads the latest 20-50 messages.
- Older messages load only when the user nears the top of the scroll container.
- Use cursor pagination, not offset.
- Prepend older messages while preserving scroll position so the view does not jump.
- Keep `hasMore` and `nextCursor` in the API response.

> **This is a brainstorm session — nothing will be built here.**
> When you are ready to move from ideas to action, run `/synapsys-create-plan` to create a structured implementation plan based on the direction you choose.
