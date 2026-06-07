import { env } from "../config/env.js";
import { ParsedExpense } from "./types.js";

interface CategoryLike {
  id: string;
  name: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

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

export async function parseWithLLM(
  input: string,
  categories: CategoryLike[]
): Promise<ParsedExpense | null> {
  if (!env.OPENROUTER_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: buildPrompt(input, categories),
          },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("OpenRouter error:", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      console.error("LLM: No content in response");
      return null;
    }

    console.log("LLM raw response:", text);

    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("LLM: No JSON found in response:", text);
      return null;
    }

    console.log("LLM extracted JSON:", jsonMatch[0]);
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("LLM parsed:", JSON.stringify(parsed));

    // Robust parse: LLMs sometimes return "7000" (string) instead of 7000 (number)
    const amount =
      parsed.amount != null ? Number(parsed.amount) : NaN;

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
