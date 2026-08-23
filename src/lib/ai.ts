import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject } from "ai";
import { z } from "zod";
import type { DocumentAnalysis } from "@/lib/types";

const provider = createOpenAICompatible({
  name: "opencode-go",
  baseURL: process.env.OPENCODE_GO_BASE_URL ?? "https://opencode.ai/zen/go/v1",
  apiKey: process.env.OPENCODE_GO_API_KEY,
});

const modelId = process.env.OPENCODE_GO_MODEL ?? "deepseek-v4-pro";

export const houseExtractionSchema = z.object({
  title: z
    .string()
    .nullable()
    .describe("Short title or address of the property"),
  description: z
    .string()
    .nullable()
    .describe("1-2 paragraph description of the property"),
  energyLabel: z
    .string()
    .nullable()
    .describe("Energy label (energielabel), e.g. A, B, C, D, E, F, G or A+"),
  livingArea: z
    .number()
    .nullable()
    .describe("Living area in square meters"),
  plotSize: z
    .number()
    .nullable()
    .describe("Plot/site size in square meters, if available"),
  price: z.number().nullable().describe("Asking price in euros, if available"),
  address: z.string().nullable().describe("Street address with city"),
});

export type HouseExtraction = z.infer<typeof houseExtractionSchema>;

export async function extractHouseFromText(
  rawText: string,
): Promise<HouseExtraction> {
  const { object } = await generateObject({
    model: provider.chatModel(modelId),
    schema: houseExtractionSchema,
    system: `You extract structured real-estate data from Dutch house listing brochures.
Respond with a JSON object using EXACTLY these keys (camelCase), no other keys:
{"title": string|null, "description": string|null, "energyLabel": string|null, "livingArea": number|null, "plotSize": number|null, "price": number|null, "address": string|null}
Example output: {"title": "Dorpsstraat 12", "description": "Mooie gezinswoning met grote tuin", "energyLabel": "A", "livingArea": 120, "plotSize": 350, "price": 450000, "address": "Dorpsstraat 12, Utrecht"}
Use null for missing fields. Numbers must be plain numbers without units or currency symbols (e.g. 120, not "120 m2"). Never invent values.`,
    prompt: rawText.slice(0, 30000),
  });
  return object;
}

const documentAnalysisSchema = z.object({
  energyLabel: z.object({
    label: z
      .string()
      .nullable()
      .describe("The energy label (energielabel), e.g. A, B, C, D, E, F, G or A+"),
    summary: z
      .string()
      .nullable()
      .describe("Summary of what the energy label section states"),
  }),
  questionnaire: z.object({
    present: z
      .boolean()
      .describe("Whether a seller's questionnaire (vragenlijst) is present"),
    summary: z
      .string()
      .nullable()
      .describe("Summary of notable answers, disclosures and known defects"),
  }),
  itemsList: z.object({
    present: z
      .boolean()
      .describe("Whether a list of items/roerende zaken (lijst van zaken) is present"),
    summary: z
      .string()
      .nullable()
      .describe("Summary of items that are included or excluded in the sale"),
  }),
  summary: z
    .string()
    .describe("Overall summary of these three documents in Dutch"),
  riskFactors: z.array(
    z.object({
      title: z.string().describe("Short Dutch title of the risk factor"),
      detail: z.string().describe("Dutch explanation of why this is a risk"),
      severity: z
        .enum(["low", "medium", "high"])
        .describe("How severe the risk is"),
    }),
  ),
});

export async function analyzeDocuments(
  rawText: string,
): Promise<DocumentAnalysis> {
  const { object } = await generateObject({
    model: provider.chatModel(modelId),
    schema: documentAnalysisSchema,
    system: `You analyze the documentation section of Dutch house listing brochures.

These brochures typically contain three distinct documents, which you must judge separately:
1. Het energielabel (energy label) — the energy efficiency rating and any notes about insulation, heating, etc.
2. De vragenlijst (seller's questionnaire) — a list of questions the seller answers about known defects, past issues, permits, etc.
3. De lijst van zaken (list of items/roerende zaken) — what movable items are included or excluded in the sale.

Respond with a JSON object using EXACTLY these keys (camelCase), no other keys:
{"energyLabel": {"label": string|null, "summary": string|null}, "questionnaire": {"present": boolean, "summary": string|null}, "itemsList": {"present": boolean, "summary": string|null}, "summary": string, "riskFactors": [{"title": string, "detail": string, "severity": "low"|"medium"|"high"}]}

Rules:
- Write all summaries, titles and details in Dutch.
- For the "summary", give a concise overall picture of what these three documents tell you about the property.
- "riskFactors" should highlight potential risk factors found in these documents (e.g. verouderd dak, funderingsproblemen, asbest, lekkage, erfpacht, achterstallig onderhoud, geen bouwvergunning, etc.). Base these strictly on what is stated in the text; do not invent risks. Include an empty array if nothing notable.
- Use null for missing or empty fields. If a document (questionnaire or items list) is not present, set present to false and summary to null.`,
    prompt: rawText.slice(0, 30000),
  });
  return object;
}

const scoringSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(10),
      rationale: z.string(),
    }),
  ),
  summary: z.string(),
});

export interface ScoringCriteria {
  id: string;
  name: string;
  weight: number;
  description: string | null;
}

export interface ScoreItem {
  name: string;
  weight: number;
  score: number;
  rationale: string;
}

export interface ScoringResult {
  total: number;
  items: ScoreItem[];
  summary: string;
}

export async function scoreHouse(
  rawText: string,
  description: string | null,
  criteria: ScoringCriteria[],
): Promise<ScoringResult> {
  const names = criteria.map((c) => c.name).join(", ");
  const criteriaText = criteria
    .map(
      (c) =>
        `- ${c.name} (weight ${c.weight})${c.description ? `: ${c.description}` : ""}`,
    )
    .join("\n");

  const { object } = await generateObject({
    model: provider.chatModel(modelId),
    schema: scoringSchema,
    system: `You score houses against a user's defined criteria.

Respond with a JSON object using EXACTLY these keys, no other keys:
{"items": [{"name": string, "score": number, "rationale": string}], "summary": string}

Rules:
- Each item's "name" must exactly match one of the provided criterion names (one item per criterion, no extras).
- "score" is a number from 0 to 10.
- Write every "rationale" and the "summary" in Dutch.
- Be strict and consistent across houses.
- When a criterion involves a distance, travel time, or proximity (e.g. "binnen 5 km van X", "dichtbij een station", "op loopafstand van ..."), do NOT guess or assume the distance from the brochure alone. Verify the actual distance by searching (web search or a maps application such as Google Maps) using the property's address, and base the score on what you find.`,

    prompt: `Score this property against the criteria below. Use EXACTLY these criterion names (one item per criterion, no extras): ${names}\n\nCriteria:\n${criteriaText}\n\nProperty description:\n${description ?? "n/a"}\n\nProperty brochure text:\n${rawText.slice(0, 20000)}\n\nRemember: for distance/proximity criteria, verify the actual distance via search or maps instead of assuming. Write all rationales and the summary in Dutch.`,
  });

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  let weightedSum = 0;

  const items: ScoreItem[] = object.items.map((item) => {
    const criterion = criteria.find(
      (c) => c.name.toLowerCase() === item.name.toLowerCase(),
    );
    const weight = criterion?.weight ?? 0;
    weightedSum += item.score * weight;
    return { name: item.name, weight, score: item.score, rationale: item.rationale };
  });

  const total = Math.round((weightedSum / totalWeight) * 100) / 10;

  return { total, items, summary: object.summary };
}
