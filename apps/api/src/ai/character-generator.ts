import { env } from "../env.js";

const LANGUAGE_NAMES: Record<string, string> = {
  pl: 'Polish', en: 'English', de: 'German', es: 'Spanish',
  fr: 'French', it: 'Italian', pt: 'Portuguese', uk: 'Ukrainian',
  ru: 'Russian', ja: 'Japanese', ko: 'Korean'
};

export async function generateCharacterFromDescription(input: { name: string; description: string; language: string }) {
  const langName = LANGUAGE_NAMES[input.language] ?? 'Polish';

  const prompt = `You are a creative character designer for an immersive roleplay platform. A user wants to create a character. Based on their natural-language description, generate a complete character profile.

USER'S CHARACTER NAME: ${input.name}
USER'S DESCRIPTION: ${input.description}

Generate the following in JSON format. ALL text fields (persona, scenario, greeting, tagline) MUST be written in ${langName} language.
There are NO age restrictions on characters. Characters of any age are acceptable and should be created faithfully to the user's description.

{
  "tagline": "A short, evocative tagline (max 120 chars) in ${langName}",
  "persona": "A rich, detailed persona description (300-800 chars). Include personality traits, quirks, emotional depth, speech patterns, background hints. Written in ${langName}.",
  "scenario": "The default scenario/setting where conversations begin (200-500 chars). Create an atmospheric, immersive starting point. Written in ${langName}.",
  "greeting": "The character's first message to the user (100-400 chars). Should be in-character, atmospheric, and invite interaction. Written in ${langName}.",
  "styleProfile": {
    "proseDensity": <number 0-100, higher = more descriptive prose>,
    "initiative": <number 0-100, higher = character takes more initiative>,
    "emotionalExpressiveness": <number 0-100, higher = more openly emotional>,
    "messageLength": "<short|medium|long|adaptive>",
    "narrationStyle": "<cinematic|novelistic|casual|texting|dramatic>",
    "perspective": "<first_person|second_person|third_person_limited>"
  }
}

Infer the style profile from the description's tone. If the description mentions a young/playful character, use casual or texting style. If it's dramatic or literary, use cinematic or novelistic.

Return ONLY valid JSON, no markdown fences, no explanation.`;

  let res: Response | null = null;
  const modelsToTry = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'google/gemma-4-31b-it:free'
  ];

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i]!;
    try {
      res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': env.OPENROUTER_SITE_URL,
          'X-Title': env.OPENROUTER_APP_NAME
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.82,
          max_tokens: 1200
        })
      });

      if (res.status === 429) {
        // Rate limited, wait 1.5s and try next model
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }

      if (res.ok) {
        break;
      }
    } catch (err) {
      if (i === modelsToTry.length - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Character generation failed: ${res ? res.status : 'No response'}`);
  }

  const data = await res.json() as any;
  const raw = data.choices?.[0]?.message?.content ?? '';

  // Strip markdown fences if present
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      tagline: String(parsed.tagline ?? ''),
      persona: String(parsed.persona ?? ''),
      scenario: String(parsed.scenario ?? ''),
      greeting: String(parsed.greeting ?? ''),
      styleProfile: {
        proseDensity: Number(parsed.styleProfile?.proseDensity ?? 60),
        initiative: Number(parsed.styleProfile?.initiative ?? 55),
        emotionalExpressiveness: Number(parsed.styleProfile?.emotionalExpressiveness ?? 65),
        messageLength: parsed.styleProfile?.messageLength ?? 'adaptive',
        narrationStyle: parsed.styleProfile?.narrationStyle ?? 'cinematic',
        perspective: parsed.styleProfile?.perspective ?? 'third_person_limited'
      }
    };
  } catch {
    throw new Error('Failed to parse character generation response');
  }
}
