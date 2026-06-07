import { env } from "../config/env.js";
import { ParsedExpense } from "./types.js";

interface CategoryLike {
  id: string;
  name: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash-lite";
const MAX_RETRIES = 2;

function buildPrompt(input: string, categories: CategoryLike[]): string {
  const categoryList = categories
    .map((c) => `- ${c.name} (id: ${c.id})`)
    .join("\n");

  return `Extract expense information from this message. Respond with ONLY valid JSON, no explanation.

User message: "${input}"

Available categories:
${categoryList || "- None"}

Rules:
- amount: number (if user says "20 mil" or "20k", that's 20000). If amount is unclear, set to null.
- currency: "USD", "COP", or "EUR". Detect from context — if the message is in Spanish and mentions "pesos" or uses Colombian expressions, default COP. If it mentions "dólares"/"usd", use USD. If unclear, set to null.
- categoryId: pick the best matching category id from the list above. If none fits, set to null.
- description: short summary of what was bought, including quantity/weight if mentioned (e.g., "avena en hojuelas 1kg"). If unclear, set to null.

Respond with exactly this JSON shape:
{"amount": number|null, "currency": "USD"|"COP"|"EUR"|null, "categoryId": "uuid"|null, "description": "string"|null}`;
}

async function callLLM(input: string, categories: CategoryLike[]): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: buildPrompt(input, categories) }],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      return data.choices?.[0]?.message?.content ?? null;
    }

    // Rate-limited — retry after the suggested delay
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const body = await response.json().catch(() => ({})) as any;
      const retryAfter = body?.error?.metadata?.retry_after_seconds ?? 2;
      console.warn(`LLM: 429 rate-limited, retrying in ${retryAfter}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 10000)));
      continue;
    }

    console.error("OpenRouter error:", response.status, await response.text().catch(() => ""));
    return null;
  }

  return null;
}

export async function parseWithLLM(
  input: string,
  categories: CategoryLike[]
): Promise<ParsedExpense | null> {
  if (!env.OPENROUTER_API_KEY) {
    return null;
  }

  try {
    const text = await callLLM(input, categories);
    if (!text) return null;

    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("LLM: No JSON found in response:", text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Robust parse: LLMs sometimes return "7000" (string) instead of 7000 (number)
    const amount = parsed.amount != null ? Number(parsed.amount) : NaN;

    return {
      amount: Number.isFinite(amount) ? amount : NaN,
      categoryId:
        typeof parsed.categoryId === "string" ? parsed.categoryId : null,
      description:
        typeof parsed.description === "string" ? parsed.description : null,
      currency:
        typeof parsed.currency === "string" &&
        ["USD", "COP", "EUR"].includes(parsed.currency)
          ? parsed.currency
          : null,
    };
  } catch (err) {
    console.error("LLM parse error:", err);
    return null;
  }
}
