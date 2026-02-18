const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

interface OllamaGenerateOptions {
  prompt: string;
  system?: string;
  model?: string;
  timeoutMs?: number;
}

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function generateJSON<T>(
  options: OllamaGenerateOptions
): Promise<T> {
  const { prompt, system, model = OLLAMA_MODEL, timeoutMs = 120_000 } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system,
        format: "json",
        stream: false,
        options: {
          temperature: 0.8,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${text}`);
    }

    const data = (await res.json()) as OllamaResponse;
    return JSON.parse(data.response) as T;
  } finally {
    clearTimeout(timeout);
  }
}
