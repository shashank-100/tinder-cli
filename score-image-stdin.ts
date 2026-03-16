import OpenAI from 'openai';
import 'dotenv/config';

async function scoreImageFromBase64(base64Image: string, mimeType: string = 'image/jpeg') {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('No API key found!');
    return;
  }

  const client = new OpenAI({ apiKey });

  console.log(`Image base64 length: ${base64Image.length} chars\n`);

  const prompt = `You are a visual attractiveness expert. Rate this profile photo based on PHYSICAL ATTRACTIVENESS ONLY.

SCORING CRITERIA (0 to 1):
1. Physical attractiveness - beauty, facial features, body (60%)
2. Photo quality - lighting, angles, presentation (30%)
3. Overall appeal - style, vibe, confidence (10%)

Return ONLY a JSON object:
{
  "score": <number from 0 to 1>,
  "reasoning": "<one sentence about attractiveness level>"
}`;

  try {
    console.log('Calling OpenAI Vision API...\n');

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }]
    });

    console.log('✅ API Response received!\n');

    const content = response.choices[0].message.content;
    if (content) {
      const result = JSON.parse(content);
      console.log('📊 Score Result:');
      console.log(`   Score: ${result.score}`);
      console.log(`   Reasoning: ${result.reasoning}\n`);
      return result;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

// Read base64 from stdin or command line
const base64Input = process.argv[2];

if (!base64Input) {
  console.error('Usage: npx tsx score-image-stdin.ts <base64-string>');
  console.error('Or pipe base64: cat image.jpg | base64 | npx tsx score-image-stdin.ts');
  process.exit(1);
}

scoreImageFromBase64(base64Input);
