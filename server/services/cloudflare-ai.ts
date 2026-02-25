const CF_API_URL = 'https://api.cloudflare.com/client/v4/accounts';

function getConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

export function isAIAvailable(): boolean {
  return getConfig() !== null;
}

async function runModel(model: string, input: unknown): Promise<unknown> {
  const config = getConfig();
  if (!config) throw new Error('Cloudflare AI not configured');

  const res = await fetch(
    `${CF_API_URL}/${config.accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${text}`);
  }

  const data = await res.json() as { result: unknown };
  return data.result;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await runModel('@cf/baai/bge-base-en-v1.5', {
    text: [text.slice(0, 512)],
  }) as { data: number[][] };
  return result.data[0];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const truncated = texts.map(t => t.slice(0, 512));
  const result = await runModel('@cf/baai/bge-base-en-v1.5', {
    text: truncated,
  }) as { data: number[][] };
  return result.data;
}

export async function chat(prompt: string, systemPrompt?: string): Promise<string> {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const result = await runModel('@cf/meta/llama-3.1-8b-instruct', {
    messages,
    max_tokens: 512,
    temperature: 0.3,
  }) as { response: string };

  return result.response;
}

export async function generateClusterSummary(
  headlines: string[],
  descriptions: string[]
): Promise<string> {
  const articlesText = headlines
    .map((h, i) => `- ${h}: ${descriptions[i]?.slice(0, 200) || ''}`)
    .slice(0, 10)
    .join('\n');

  const prompt = `Summarize these related news articles into 2-3 sentences (max 60 words). Be factual and concise. No opinions.

Articles:
${articlesText}

Summary:`;

  return chat(prompt, 'You are a concise news summarizer. Output only the summary, nothing else.');
}

export async function generateBiasAnalysis(
  clusterTopic: string,
  leftArticles: string[],
  centerArticles: string[],
  rightArticles: string[]
): Promise<{
  leftEmphasizes: string;
  rightEmphasizes: string;
  consistentAcrossAll: string;
  whatsMissing: string;
}> {
  const prompt = `Analyze media framing for this news story: "${clusterTopic}"

Left-leaning coverage:
${leftArticles.slice(0, 3).join('\n') || 'No coverage'}

Center coverage:
${centerArticles.slice(0, 3).join('\n') || 'No coverage'}

Right-leaning coverage:
${rightArticles.slice(0, 3).join('\n') || 'No coverage'}

Respond ONLY with valid JSON (no markdown, no explanation):
{"leftEmphasizes":"1 sentence","rightEmphasizes":"1 sentence","consistentAcrossAll":"1 sentence","whatsMissing":"1 sentence"}`;

  const response = await chat(prompt, 'You output only valid JSON. No markdown. No explanation.');

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fallback
  }

  return {
    leftEmphasizes: 'Analysis pending.',
    rightEmphasizes: 'Analysis pending.',
    consistentAcrossAll: 'Analysis pending.',
    whatsMissing: 'Analysis pending.',
  };
}

export async function generateDigestSummary(
  topics: { topic: string; summary: string; articleCount: number }[]
): Promise<string> {
  const topicList = topics
    .slice(0, 10)
    .map(t => `- ${t.topic} (${t.articleCount} sources): ${t.summary || t.topic}`)
    .join('\n');

  const prompt = `Write a 150-word daily news digest from these top stories. Conversational but factual. Start with "Good morning." End with a brief closing line.

Today's top stories:
${topicList}

Digest:`;

  return chat(prompt, 'You are a news digest writer. Write naturally, concisely. Include key numbers and facts.');
}
