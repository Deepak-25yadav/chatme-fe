# ChatMe Frontend

Frontend application for ChatMe built with Angular and TypeScript.

## Features

- Real-time chat with Socket.io
- Message status indicators (single tick, double tick, seen)
- Date grouping for messages
- Online/offline status
- Typing indicators
- Emoji picker
- Message operations (edit, delete, reply)
- WhatsApp-like UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update the API URL in `src/environments/environment.ts` if needed:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

3. Run the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

## Build

Build for production:
```bash
npm run build
```

## Usage

1. The app automatically creates a user ID and stores it in localStorage
2. Select a user from the user list to start chatting
3. Type a message and press Enter or click the send button
4. Use the emoji button to add emojis
5. Click on a message (three dots menu) to edit, reply, or delete
6. Message status will update automatically (sent → delivered → seen)

## Components

- `ChatComponent` - Main chat container
- `UserListComponent` - List of users
- `MessageListComponent` - List of messages
- `MessageInputComponent` - Message input with emoji picker

## Services

- `SocketService` - Handles Socket.io connections and events
- `ChatService` - Handles HTTP API calls
