import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

let genAIClient = null;

function getClient() {
  if (!genAIClient && env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAIClient;
}

export async function generate({
  system,
  messages,
  temperature = 0.2,
  maxTokens = 1000,
  responseFormat,
  model = 'gemini-1.5-flash',
  signal,
}) {
  const client = getClient();
  if (!client) {
    throw new Error('Gemini client not configured or API key missing');
  }

  const modelOptions = {
    model,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  if (system) {
    modelOptions.systemInstruction = system;
  }

  if (responseFormat === 'json') {
    modelOptions.generationConfig.responseMimeType = 'application/json';
  }

  const generativeModel = client.getGenerativeModel(modelOptions);

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const result = await generativeModel.generateContent({
    contents,
  });

  const response = await result.response;
  const text = response.text() || '';

  return {
    text: text.trim(),
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    model,
    provider: 'gemini',
  };
}

