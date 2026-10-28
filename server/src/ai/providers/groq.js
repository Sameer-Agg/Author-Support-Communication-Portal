import Groq from 'groq-sdk';
import { env } from '../../config/env.js';

let groqClient = null;

function getClient() {
  if (!groqClient && env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClient;
}

export async function generate({
  system,
  messages,
  temperature = 0.2,
  maxTokens = 1000,
  responseFormat,
  model = 'openai/gpt-oss-120b',
  signal,
}) {
  const client = getClient();
  if (!client) {
    throw new Error('Groq client not configured or API key missing');
  }

  const formattedMessages = [];
  if (system) {
    formattedMessages.push({ role: 'system', content: system });
  }

  for (const msg of messages) {
    formattedMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  const params = {
    model,
    messages: formattedMessages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat === 'json') {
    params.response_format = { type: 'json_object' };
  }

  const response = await client.chat.completions.create(params, { signal });

  const choice = response.choices[0];
  const text = choice?.message?.content || '';

  return {
    text: text.trim(),
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    model: response.model || model,
    provider: 'groq',
  };
}

