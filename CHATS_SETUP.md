# Chats Table Setup Guide

This guide explains how to set up the new `chats` table in your Supabase database to track chat messages linked to patients.

## Table Structure

The `chats` table includes the following fields:
- `id`: Primary key (auto-generated)
- `paciente_id`: Foreign key referencing `pacientes.id` 
- `messages_amount`: Number of messages in the chat (default: 0)
- `chat_cost`: Total cost of the chat in currency units (default: 0)
- `total_tokens`: Total tokens used (default: 0)
- `cache_tokens`: Cache tokens used (default: 0)
- `input_tokens`: Input tokens used (default: 0)
- `output_tokens`: Output tokens used (default: 0)
- `created_at`: Timestamp when record was created (auto-generated)
- `updated_at`: Timestamp when record was last updated (auto-updated)

## Setup Instructions

### 1. Create the Table in Supabase

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create_chats_table.sql` 
4. Execute the SQL script

This will create:
- The `chats` table with all required fields and constraints
- Indexes for better performance
- Row Level Security (RLS) policies
- Automatic `updated_at` timestamp trigger

### 2. Verify the Setup

After running the SQL script, you should see:
- A new `chats` table in your database
- RLS enabled on the table
- Proper foreign key relationship to `pacientes` table

## API Endpoints

The following API endpoints are now available:

### Create a new chat
```
POST /api/chats
Content-Type: application/json

{
  "paciente_id": 1,
  "messages_amount": 0,
  "chat_cost": 0,
  "total_tokens": 0,
  "cache_tokens": 0,
  "input_tokens": 0,
  "output_tokens": 0
}
```

### Get all chats (with optional filtering)
```
GET /api/chats
GET /api/chats?paciente_id=1
GET /api/chats?limit=10&offset=0
```

### Get a specific chat
```
GET /api/chats/[id]
```

### Update a chat
```
PATCH /api/chats/[id]
Content-Type: application/json

{
  "messages_amount": 5,
  "chat_cost": 0.25,
  "total_tokens": 1000
}
```

### Delete a chat
```
DELETE /api/chats/[id]
```

## TypeScript Types

The following TypeScript types have been added to `app/product/types.ts`:

- `NewChat`: For creating new chat records
- `Chat`: Complete chat record structure
- `ChatWithPaciente`: Chat record with patient information
- `UpdateChat`: For updating existing chat records

## Helper Functions

The `lib/chats.ts` file provides utility functions:

- `createChat(chatData: NewChat)`: Create a new chat
- `updateChat(id: number, updates: UpdateChat)`: Update an existing chat
- `getChatById(id: number)`: Get a chat by ID
- `getChatsByPaciente(pacienteId: number)`: Get all chats for a patient
- `incrementChatStats(id, messageIncrement, tokenStats)`: Increment chat statistics

## Usage Example

```typescript
import { createChat, incrementChatStats } from '@/lib/chats';

// Create a new chat for a patient
const { data: chat, error } = await createChat({
  paciente_id: 1,
  messages_amount: 0,
  chat_cost: 0,
  total_tokens: 0,
  cache_tokens: 0,
  input_tokens: 0,
  output_tokens: 0
});

// Later, increment the chat stats after a message
if (chat) {
  await incrementChatStats(chat.id, 1, {
    totalTokens: 150,
    inputTokens: 100,
    outputTokens: 50,
    cost: 0.05
  });
}
```

## Security

- Row Level Security (RLS) is enabled on the `chats` table
- Only authenticated users can access the table
- The table has proper foreign key constraints to ensure data integrity
- All numeric fields have check constraints to prevent negative values

## Database Relationships

The `chats` table has a foreign key relationship with the `pacientes` table:
- `chats.paciente_id` → `pacientes.id`
- When a patient is deleted, all associated chats are automatically deleted (CASCADE)
