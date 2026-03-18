import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/**
 * ANALYZE LAYER: LLM-powered profile analysis
 * Clean separation from browser automation
 */

export interface AnalysisResult {
  score: number;          // 0-10
  action: 'RIGHT' | 'LEFT';
  reasoning: string;
  name: string;
  age: number;
  bio: string;
}

export class ProfileAnalyzer {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Main analysis function: Takes raw page text + images, returns decision
   */
  async analyze(
    pageText: string,
    imagePaths: string[]
  ): Promise<AnalysisResult> {
    // Step 1: Extract profile data from text
    const profile = await this.extractProfile(pageText);

    // Step 2: Analyze images using Vision API
    const imageAnalysis = await this.analyzeImages(imagePaths);

    // Step 3: Calculate final score (images only)
    const finalScore = imageAnalysis.score;

    // Step 4: Decide action
    const action = finalScore >= 7.0 ? 'RIGHT' : 'LEFT';
    const reasoning = imageAnalysis.reasoning;

    return {
      score: Math.round(finalScore * 10) / 10,
      action,
      reasoning,
      name: profile.name,
      age: profile.age,
      bio: profile.bio
    };
  }

  /**
   * Extract profile info from raw page text
   */
  private async extractProfile(pageText: string): Promise<{
    name: string;
    age: number;
    bio: string;
  }> {
    const prompt = `Extract profile information from Tinder page text. Bio is OPTIONAL.

PROFILE TEXT:
${pageText.substring(0, 2000)}

TASK: Just extract the data
Return ONLY JSON:
{
  "name": "extracted name",
  "age": number,
  "bio": "extracted bio or empty string"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.choices[0].message.content;
      if (content) {
        const result = JSON.parse(content);
        return {
          name: result.name || 'Unknown',
          age: result.age || 0,
          bio: result.bio || ''
        };
      }
    } catch (error) {
      console.error('Error extracting profile:', error);
    }

    return { name: 'Unknown', age: 0, bio: '' };
  }

  /**
   * Analyze images using Vision API
   */
  private async analyzeImages(imagePaths: string[]): Promise<{
    score: number;
    reasoning: string;
  }> {
    if (!imagePaths || imagePaths.length === 0) {
      return { score: 0, reasoning: 'No images available' };
    }

    try {
      const imagesToAnalyze = imagePaths.slice(0, 4);

      // Convert to base64 or use URLs
      const imageContents = imagesToAnalyze.map(filepath => {
        if (filepath.startsWith('http://') || filepath.startsWith('https://')) {
          return filepath;
        } else {
          const buffer = fs.readFileSync(filepath);
          const base64 = buffer.toString('base64');
          const ext = path.extname(filepath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
          };
          const mimeType = mimeTypes[ext] || 'image/jpeg';
          return `data:${mimeType};base64,${base64}`;
        }
      });

      const prompt = this.getVisionPrompt(imagesToAnalyze.length);

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageContents.map(url => ({
              type: 'image_url' as const,
              image_url: { url }
            }))
          ]
        }
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
        messages
      });

      const content = response.choices[0].message.content;
      if (content) {
        const result = JSON.parse(content);
        return {
          score: result.score || 0,
          reasoning: result.reasoning || 'No reasoning provided'
        };
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
    }

    return { score: 5, reasoning: 'Unable to analyze images' };
  }

  /**
   * Vision API prompt
   */
  private getVisionPrompt(imageCount: number): string {
    return `You are an AI dating assistant analyzing Tinder profile images.

Your task is to evaluate the images and determine whether the agent should swipe right or swipe left.

Analyze up to ${imageCount} images and evaluate the following:

1. FACE VISIBILITY
Check if at least one image contains a clearly visible human face.
If no clear human face is visible in any image, the profile should be rejected.

Examples of NO_FACE cases:
- Landscapes
- Pets only
- Food photos
- Memes or text images
- Extremely blurry images
- Photos where the person is turned away
- Face obscured by objects, hands, or filters
- Face cut off from frame

2. ATTRACTIVENESS
Rate the attractiveness of the person on a scale from 1 to 10 based on:
- Facial symmetry
- Grooming and appearance
- Confidence and body language
- Overall presentation in the images

DECISION RULES:
- If NO_FACE → score: 0
- If attractiveness_score < 5 → score should reflect this (1-4 range)
- Otherwise score based on attractiveness (5-10 range)

Return ONLY a JSON object:
{
  "score": <number from 0 to 10 with decimals>,
  "reasoning": "<brief objective analysis based on the criteria>"
}`;
  }
}
