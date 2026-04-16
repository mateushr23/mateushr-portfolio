import Anthropic from "@anthropic-ai/sdk";

/**
 * Input shape for the describe step. Derived from the GitHub signal we
 * persist in `source_hash` — keep these fields 1:1 with the hash input
 * so a hash match really does imply the describe output is current.
 */
export type DescribeInput = {
  name: string;
  description_gh: string | null;
  topics: string[];
  language: string | null;
};

const DESCRIBE_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 150;

const SYSTEM_PROMPT = [
  "Você é um redator técnico conciso em PT-BR.",
  "Escreva 1 a 2 frases descrevendo o que o repositório faz.",
  "Tom neutro e profissional, sem marketing.",
  "Não use markdown, aspas, listas, emojis nem prefixos do tipo 'Este projeto...'.",
  "Se o nome e os topics forem ambíguos, foque no que for possível inferir com segurança.",
  "Saída: apenas o texto da descrição, sem comentários adicionais.",
].join(" ");

/**
 * Lazily construct the Anthropic client. Caller is responsible for
 * verifying the key is present before invoking this — `generateDescription`
 * checks `process.env.ANTHROPIC_API_KEY` up front and short-circuits to
 * `null` if absent, so this path is only reached when the key exists.
 */
function createClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

function buildUserPrompt(repo: DescribeInput): string {
  const topicsLine = repo.topics.length > 0 ? repo.topics.join(", ") : "(nenhum)";
  const descriptionLine = repo.description_gh?.trim() || "(sem descrição no GitHub)";
  const languageLine = repo.language ?? "(não informada)";

  return [
    `Nome do repositório: ${repo.name}`,
    `Descrição atual no GitHub: ${descriptionLine}`,
    `Topics: ${topicsLine}`,
    `Linguagem principal: ${languageLine}`,
    "",
    "Escreva a descrição em PT-BR (1-2 frases).",
  ].join("\n");
}

/**
 * Generate a PT-BR description for a repo via Claude Haiku.
 * Non-streaming. Returns the trimmed text, or `null` if the
 * ANTHROPIC_API_KEY is absent or the Claude call fails. A `null`
 * return is the caller's signal to skip description regeneration
 * without aborting the rest of the sync for this repo.
 */
export async function generateDescription(repo: DescribeInput): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const client = createClient(apiKey);

    const response = await client.messages.create({
      model: DESCRIBE_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(repo) }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );

    if (!textBlock) {
      console.warn(`generateDescription: no text block in response for ${repo.name}`);
      return null;
    }

    return textBlock.text.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`generateDescription: Claude call failed for ${repo.name} — ${message}`);
    return null;
  }
}
