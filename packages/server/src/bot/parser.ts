// Pure function — no side effects, no DB calls
import { ParsedExpense } from "./types.js";

interface CategoryLike {
  id: string;
  name: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "comida",
    "almuerzo",
    "cena",
    "desayuno",
    "merienda",
    "restaurante",
    "super",
    "supermercado",
    "grocery",
    "panaderia",
    "carniceria",
    "verduleria",
  ],
  Transport: [
    "transporte",
    "uber",
    "taxi",
    "bondi",
    "subte",
    "tren",
    "colectivo",
    "remis",
    "viaje",
    "combustible",
    "nafta",
    "gasolina",
    "peaje",
    "estacionamiento",
  ],
  Entertainment: [
    "entretenimiento",
    "netflix",
    "spotify",
    "cine",
    "teatro",
    "streaming",
    "juegos",
    "diversion",
    "fiesta",
    "bar",
    "pub",
  ],
  Utilities: [
    "servicios",
    "luz",
    "gas",
    "agua",
    "internet",
    "telefono",
    "celular",
    "wifi",
    "cable",
  ],
  Health: [
    "salud",
    "medico",
    "farmacia",
    "medicina",
    "hospital",
    "obra social",
    "seguro",
    "dentista",
    "oculista",
  ],
  Shopping: [
    "shopping",
    "ropa",
    "zapatillas",
    "compras",
    "regalo",
    "mall",
    "zapateria",
    "libreria",
    "electronica",
  ],
  Housing: [
    "vivienda",
    "alquiler",
    "hipoteca",
    "expensas",
    "mantenimiento",
    "hogar",
    "muebles",
    "decoracion",
  ],
  Income: [
    "ingreso",
    "sueldo",
    "salario",
    "deposito",
    "transferencia",
    "cobro",
    "pago recibido",
  ],
  Other: ["otro", "misc", "varios", "imprevisto"],
};

function normalizeNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return Number.isNaN(num) || num <= 0 ? NaN : num;
}

function getKeywords(categoryName: string): string[] {
  return CATEGORY_KEYWORDS[categoryName] ?? [];
}

function matchCategory(
  candidate: string,
  categories: CategoryLike[]
): CategoryLike | null {
  const lowerCandidate = candidate.toLowerCase().trim();
  if (!lowerCandidate) return null;

  for (const cat of categories) {
    const nameLower = cat.name.toLowerCase();
    if (
      nameLower === lowerCandidate ||
      nameLower.includes(lowerCandidate) ||
      lowerCandidate.includes(nameLower)
    ) {
      return cat;
    }

    const keywords = getKeywords(cat.name);
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (
        kwLower === lowerCandidate ||
        lowerCandidate.includes(kwLower) ||
        kwLower.includes(lowerCandidate)
      ) {
        return cat;
      }
    }
  }

  return null;
}

/**
 * Tier 1: Structured format.
 * Pattern: `<amount> <category> [description]`
 */
export function parseExpense(
  input: string,
  categories: CategoryLike[]
): ParsedExpense | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d[\d.,]*)\s*(.*)$/);
  if (!match) return null;

  const amount = normalizeNumber(match[1]);
  if (Number.isNaN(amount)) return null;

  const rest = match[2].trim();
  if (!rest) {
    return { amount, categoryId: null, description: null };
  }

  const words = rest.split(/\s+/);
  const maxPrefix = Math.min(4, words.length);

  for (let len = maxPrefix; len > 0; len--) {
    const candidate = words.slice(0, len).join(" ");
    const cat = matchCategory(candidate, categories);
    if (cat) {
      const description = words.slice(len).join(" ") || null;
      return { amount, categoryId: cat.id, description };
    }
  }

  // No category matched; treat the rest as description
  return { amount, categoryId: null, description: rest };
}

/**
 * Tier 2: Free-form natural language.
 * Extracts the largest number and guesses the category from any word.
 */
export function parseFreeForm(
  input: string,
  categories: CategoryLike[]
): ParsedExpense | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const numbers: number[] = [];
  const numRegex = /\d[\d.,]*/g;
  let m: RegExpExecArray | null;
  while ((m = numRegex.exec(trimmed)) !== null) {
    const num = normalizeNumber(m[0]);
    if (!Number.isNaN(num)) {
      numbers.push(num);
    }
  }

  if (numbers.length === 0) return null;
  const amount = Math.max(...numbers);

  const words = trimmed.split(/\s+/).map((w) =>
    w.toLowerCase().replace(/[^\w\sáéíóúñ]/g, "")
  );

  let categoryId: string | null = null;
  for (const cat of categories) {
    const nameLower = cat.name.toLowerCase();
    for (const word of words) {
      if (
        word === nameLower ||
        nameLower.includes(word) ||
        word.includes(nameLower)
      ) {
        categoryId = cat.id;
        break;
      }
      const keywords = getKeywords(cat.name);
      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (
          word === kwLower ||
          kwLower.includes(word) ||
          word.includes(kwLower)
        ) {
          categoryId = cat.id;
          break;
        }
      }
      if (categoryId) break;
    }
    if (categoryId) break;
  }

  return { amount, categoryId, description: trimmed };
}

/**
 * Tier 3: LLM fallback (stub).
 * TODO: Integrate OpenRouter when API key is available.
 */
export async function parseWithLLM(
  _input: string,
  _categories: CategoryLike[]
): Promise<ParsedExpense | null> {
  // TODO: call OpenRouter for natural language understanding
  return null;
}
