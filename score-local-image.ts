import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function scoreLocalImage(imagePath: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('No API key found!');
    return;
  }

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.error(`File not found: ${imagePath}`);
    return;
  }

  const client = new OpenAI({ apiKey });

  // Read the local image file
  console.log(`Reading image: ${imagePath}\n`);
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Detect image type from extension
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  console.log(`Image size: ${imageBuffer.length} bytes`);
  console.log(`Image type: ${mimeType}\n`);

  const prompt = `You are a dating profile photo analyzer. Rate this photo's overall appeal for a dating profile.

MANDATORY FACE REQUIREMENT:
- First, check if the person's FACE is clearly visible
- If face is NOT visible, hidden, obscured, blurry, turned away, covered by objects/hands, or cut off → return score: 0
- If face IS NOT clearly visible, STOP analysis immediately and return score 0

SCORING CRITERIA (only if face is clearly visible):
Rate from 0 to 10 based on these objective factors:

1. FACIAL FEATURES (70% weight):
   - Facial symmetry and proportions
   - Feature clarity (eyes, nose, lips, jawline)
   - Skin appearance
   - Expression quality (smile, friendliness)
   - Overall facial aesthetics

2. PHYSICAL PRESENTATION (20% weight):
   - Body proportions and fitness indicators
   - Posture and confidence
   - Grooming and styling
   - Overall presentation

3. PHOTO QUALITY (10% weight):
   - Lighting quality
   - Photo clarity and sharpness
   - Framing and composition
   - Professional appearance

SCORING GUIDELINES:
- 0 = Face not visible
- 1-10 = Rate based on the criteria above
- Use precise decimals (e.g., 6.3, 7.8, 8.5)
- Be objective and use the full 1-10 range
- Don't cluster around certain numbers

Return ONLY a JSON object:
{
  "score": <number from 0 to 10 with decimals>,
  "reasoning": "<brief objective analysis based on the criteria>"
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

// Get image path from command line or use default
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Usage: npx tsx score-local-image.ts <path-to-image>');
  console.error('Example: npx tsx score-local-image.ts ./profile_images/image.jpg');
  process.exit(1);
}

scoreLocalImage(imagePath);
