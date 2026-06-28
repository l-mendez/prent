// Shared application types

export type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type OutputFormat = {
  message: string;
  suggestions: string[];
};

export type NextQuestionPayload = { message?: string; suggestions?: string[] };

export type GenerateTextResult<T> = { text: string; object?: T | null };

export type ChatUsage = {
  cache_tokens: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
};
