import OpenAI from 'openai';
import 'dotenv/config';

async function testVision() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('No API key found!');
    return;
  }

  const client = new OpenAI({ apiKey });

  // Use the URL from the screenshot you shared
  const testImageUrl = 'https://images-ssl.gotinder.com/u/wZUjFytr9pwCv8YCht4Yav/e64ys8TrG8L8uonE5R7nnj.webp?Policy=eyJTdGF0ZW1lbnQiOiBbeyJSZXNvdXJjZSI6IiovdS93WlVqRnl0cjlwd0N2OFlDaHQ0WWF2LyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3NzQyMzYwOTh9fX1dfQ__&Signature=EUhQkVTp8vJe0DM~9yFmrLJ7V2bkHhQwjr9YPH6mQgSlJCiDWx9tBQd35YxUILYaH~i7yZAGPCTj3lRFvw1G-cGVSXgztVJGOdpF~6w5kI~6CsUCcbK6nDNxlqEOoAq3vQT3qPFNZgMkP0NKoLhTBX0FWi1XeGb7AYrD6~y5LtPPl7fvN3v-MDbFCXQjG-PzQpTSVPtEQu-vW0jqWnIcLjHCQz0UzH0TqPNYJqWB2wXpEGBQ1n~PiFqV7QYb~cj7Z7s6A7uP4BLZTqQa~ZqOZQqR4e0c8F9rBqpXqFQ__&Key-Pair-Id=K368TLDEUPA6OI';

  console.log('Testing OpenAI Vision API...\n');
  console.log('Image URL:', testImageUrl.substring(0, 80) + '...\n');

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
    console.log('Calling OpenAI API with vision...\n');

    const response = await client.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07',
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: testImageUrl } }
        ]
      }]
    });

    console.log('✅ API Response received!\n');
    console.log('Response:', JSON.stringify(response, null, 2));

    const content = response.choices[0].message.content;
    if (content) {
      console.log('\n📊 Parsed result:');
      console.log(JSON.parse(content));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

testVision();
