import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const imagesDir = '/Users/shashank/tinder-cli/profile_images';
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

if (files.length === 0) {
  console.log('No images found');
  process.exit(1);
}

const testImage = path.join(imagesDir, files[0]);
console.log(`Testing with: ${files[0]}`);

const buffer = fs.readFileSync(testImage);
const base64 = buffer.toString('base64');
const dataUrl = `data:image/jpeg;base64,${base64}`;

const response = await client.chat.completions.create({
  model: 'gpt-5-mini-2025-08-07',
  max_completion_tokens: 200,
  response_format: { type: 'json_object' },
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Rate this photo on attractiveness from 0-10. Return JSON: {"score": number, "reasoning": "brief reason"}' },
      { type: 'image_url', image_url: { url: dataUrl } }
    ]
  }]
});

console.log('Response:', response.choices[0].message.content);
console.log('Full choice:', JSON.stringify(response.choices[0], null, 2));
