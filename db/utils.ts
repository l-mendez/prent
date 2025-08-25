import { getSupabaseServerClient } from './supabaseClient';
import { ChatUsage } from '@/app/(product)/types';
import { NextResponse } from 'next/server';

const supabase = getSupabaseServerClient();


const GPT5 = { inputTokenCost: 1.25e-6, cachedInputTokenCost: 0.125e-6, outputTokenCost: 10e-6 }; // USD per token

export const calculateCost = (usage: ChatUsage) => {
    return (usage.input_tokens || 0) * GPT5.inputTokenCost + (usage.output_tokens || 0) * GPT5.outputTokenCost + (usage.cache_tokens || 0) * GPT5.cachedInputTokenCost;
}

// Accept usage in either snake_case (our type) or camelCase (AI SDK) and normalize
const normalizeUsage = (usage: unknown): ChatUsage => {
    const u: any = usage || {};
    return {
        cache_tokens: u.cache_tokens ?? u.cachedInputTokens ?? u.cacheTokens ?? 0,
        input_tokens: u.input_tokens ?? u.inputTokens ?? 0,
        output_tokens: u.output_tokens ?? u.outputTokens ?? 0,
    } as ChatUsage;
}

export const apiKeyExists = async (apiKey: string) => {
    const { data, error } = await supabase.from('api_keys').select('*').eq('api_key', apiKey).single();
    return data !== null && error === null;
}

export const updateApiKeyUsage = async (apiKey: string, costInc: number) => {
    try{
        if (!costInc || costInc <= 0) {
            return;
        }
        const { data: apiKeyData, error: apiKeyError } = await supabase.from('api_keys').select('usage').eq('api_key', apiKey).single();
        if (apiKeyError) {
            throw apiKeyError;
        }
        const { error: apiKeyUpdateError } = await supabase.from('api_keys').update({
            usage: (apiKeyData?.usage || 0) + costInc,
        }).eq('api_key', apiKey);
        if (apiKeyUpdateError) {
            throw apiKeyUpdateError;
        }
    }
    catch (error) {
        console.error('Error in updateApiKeyUsage:', error);
        return NextResponse.json(
          { error: 'Failed to update API key usage' },
          { status: 500 }
        );
    }
}

export async function getApiKeyId(apiKey: string) {

    const { data, error } = await supabase.from('api_keys').select('id').eq('api_key', apiKey).single();
    return data?.id;
}

export async function createChat(apiKey: string, usage: ChatUsage){

    if (!apiKey) {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    if (!usage) {
        return NextResponse.json({ error: 'Usage data is required' }, { status: 400 });
    }

    if (!(await apiKeyExists(apiKey))) {
        return NextResponse.json({ error: 'API key is not valid' }, { status: 400 });
    }
    const apiKeyId = await getApiKeyId(apiKey);
    if (!apiKeyId) {
        return NextResponse.json({ error: 'Failed to get API key ID' }, { status: 500 });
    }

    const normalized = normalizeUsage(usage);
    const initialCost = calculateCost(normalized);

    const { data, error } = await supabase
        .from('chats')
        .insert({
            api_key_id: apiKeyId,
            cache_tokens: normalized.cache_tokens || 0,
            input_tokens: normalized.input_tokens || 0,
            output_tokens: normalized.output_tokens || 0,
            total_tokens: (normalized.input_tokens || 0) + (normalized.output_tokens || 0) + (normalized.cache_tokens || 0),
            chat_cost: initialCost,
            messages_amount: 2,
            created_at: new Date('UTC-3'),
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error in createChat:', error);
        return NextResponse.json(
          { error: 'Failed to create chat' },
          { status: 500 }
        );
    }

    await updateApiKeyUsage(apiKey, initialCost);

    return data;
}

export async function updateChat(apiKey: string, id: number, tokenUsage: ChatUsage) {

    try {
      if (!apiKey) {
        return NextResponse.json({ error: 'API key is not valid' }, { status: 400 });
      }
      if (!(await apiKeyExists(apiKey))) {
        return NextResponse.json({ error: 'API key is not valid' }, { status: 400 });
      }
      if (!tokenUsage) {
        return NextResponse.json({ error: 'Token usage data is required' }, { status: 400 });
      }
      if (!id) {
        return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
      }
  
      // Get current chat data
      const { data: current, error: fetchErr } = await supabase
        .from('chats')
        .select('cache_tokens,input_tokens,output_tokens,total_tokens,chat_cost,messages_amount')
        .eq('id', id)
        .single();
  
      if (fetchErr) {
        throw fetchErr;
      }
  
      const normalized = normalizeUsage(tokenUsage);
      const cacheInc = normalized.cache_tokens || 0;
      const inputInc = normalized.input_tokens || 0;
      const outputInc = normalized.output_tokens || 0;
      const totalTokensInc = cacheInc + inputInc + outputInc;
      const messagesInc = 2; // increment messages by 2
      const costInc = calculateCost(normalized);
  
      await supabase.from('chats').update({
          cache_tokens: (current?.cache_tokens || 0) + cacheInc,
          input_tokens: (current?.input_tokens || 0) + inputInc,
          output_tokens: (current?.output_tokens || 0) + outputInc,
          total_tokens: (current?.total_tokens || 0) + totalTokensInc,
          chat_cost: (current?.chat_cost || 0) + costInc,
          messages_amount: (current?.messages_amount || 0) + messagesInc,
          updated_at: new Date('UTC-3'),
      }).eq('id', id);

      await updateApiKeyUsage(apiKey, costInc);
  
    } catch (error) {
      console.error('Error in POST /api/price:', error);
      return NextResponse.json(
        { error: 'Failed to calculate price' },
        { status: 500 }
      );
    }
  }