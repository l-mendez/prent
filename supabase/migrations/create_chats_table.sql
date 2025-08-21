-- Create chats table to track chat messages linked to patients
CREATE TABLE IF NOT EXISTS public.chats (
    id BIGSERIAL PRIMARY KEY,
    paciente_id BIGINT NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    messages_amount INTEGER NOT NULL DEFAULT 0 CHECK (messages_amount >= 0),
    chat_cost DECIMAL(10,4) NOT NULL DEFAULT 0 CHECK (chat_cost >= 0),
    total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
    cache_tokens INTEGER NOT NULL DEFAULT 0 CHECK (cache_tokens >= 0),
    input_tokens INTEGER NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens INTEGER NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_paciente_id ON public.chats(paciente_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON public.chats(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON public.chats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy to allow authenticated users to view all chats
CREATE POLICY "Allow authenticated users to view chats" ON public.chats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert chats
CREATE POLICY "Allow authenticated users to insert chats" ON public.chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update chats
CREATE POLICY "Allow authenticated users to update chats" ON public.chats
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete chats
CREATE POLICY "Allow authenticated users to delete chats" ON public.chats
    FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.chats TO service_role;
