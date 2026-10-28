import * as groqProvider from './groq.js';
import * as geminiProvider from './gemini.js';
import { env } from '../../config/env.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeAIRequest(options) {
  const timeoutMs = options.timeoutMs || 15000;

  let lastError = null;

  if (env.GROQ_API_KEY) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const result = await groqProvider.generate({
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timer);
        return result;
      } catch (err) {
        clearTimeout(timer);
        lastError = err;

        const isRateLimit = err?.status === 429 || err?.message?.includes('429');
        const isServerError = err?.status >= 500 && err?.status < 600;

        if (attempt === 1 && (isRateLimit || isServerError)) {
          await sleep(600);
          continue;
        }
        break;
      }
    }
  }

  if (env.GEMINI_API_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await geminiProvider.generate({
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }

  throw new Error(`AI generation failed across available providers: ${lastError?.message || 'No providers available'}`);
}

