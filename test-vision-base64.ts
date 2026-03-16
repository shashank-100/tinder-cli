import OpenAI from 'openai';
import fs from 'fs';
import 'dotenv/config';

async function testVisionBase64() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('No API key found!');
    return;
  }

  const client = new OpenAI({ apiKey });

  // Download a test image (public URL)
  const testUrl = 'https://picsum.photos/400/600';

  console.log('Downloading test image...\n');
  const response = await fetch(testUrl);
  const buffer = await response.arrayBuffer();
  const base64Image = Buffer.from(buffer).toString('base64');

  console.log(`Image size: ${buffer.byteLength} bytes`);
  console.log(`Base64 length: ${base64Image.length} chars\n`);

  const prompt = `Rate this photo based on visual attractiveness (0-1 scale).

Return ONLY JSON:
{
  "score": <number 0 to 1>,
  "reasoning": "<one sentence>"
}`;

  try {
    console.log('Calling OpenAI Vision API with base64 image...\n');

    const result = await client.chat.completions.create({
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
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }]
    });

    console.log('✅ Success!\n');
    const content = result.choices[0].message.content;
    if (content) {
      console.log('Result:', JSON.parse(content));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

testVisionBase64();
