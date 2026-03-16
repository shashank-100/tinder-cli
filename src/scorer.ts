import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { UserPreferences, Profile, SwipeDecision } from './types.js';

export class ProfileScorer {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  private calculateInterestMatch(profile: Profile, prefs: UserPreferences): number {
    if (profile.interests.length === 0 || prefs.interests.length === 0) {
      return 0;
    }

    const profileInterests = new Set(profile.interests.map(i => i.toLowerCase()));
    const prefInterests = prefs.interests.map(i => i.toLowerCase());

    const matches = prefInterests.filter(i => profileInterests.has(i)).length;
    return matches / prefInterests.length;
  }

  private calculateAgeMatch(profile: Profile, prefs: UserPreferences): number {
    const { min, max } = prefs.ageRange;

    if (profile.age >= min && profile.age <= max) {
      const range = max - min;
      const mid = (min + max) / 2;
      const distanceFromMid = Math.abs(profile.age - mid);
      return 1 - (distanceFromMid / (range / 2)) * 0.5;
    }

    const distanceOutside = profile.age < min ? min - profile.age : profile.age - max;
    return Math.max(0, 1 - (distanceOutside / 10));
  }

  private calculateDistanceScore(profile: Profile, prefs: UserPreferences): number {
    if (profile.distance <= prefs.distance) {
      return 1 - (profile.distance / prefs.distance) * 0.5;
    }

    const excessDistance = profile.distance - prefs.distance;
    return Math.max(0, 1 - (excessDistance / prefs.distance));
  }

  private async calculateBioSimilarity(
    profile: Profile,
    prefs: UserPreferences
  ): Promise<{ score: number; reasoning: string }> {
    const prompt = `You are a dating compatibility expert. Evaluate this profile against user preferences.

User Preferences:
- Type: ${prefs.type.join(', ')}
- Interests: ${prefs.interests.join(', ')}
- Age Range: ${prefs.ageRange.min}-${prefs.ageRange.max}

Profile:
Name: ${profile.name}
Age: ${profile.age}
Bio: ${profile.bio}
Interests: ${profile.interests.join(', ')}

Analyze the bio and overall profile vibe. Consider:
1. Does the bio align with preferred types?
2. Are there personality indicators that match?
3. Are there red flags or green flags?

Return ONLY a JSON object in this exact format:
{
  "score": <number from 0 to 1>,
  "reasoning": "<brief 1-2 sentence explanation>"
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.choices[0].message.content;
      if (content) {
        const result = JSON.parse(content);
        return {
          score: result.score,
          reasoning: result.reasoning
        };
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
    }

    return { score: 0.5, reasoning: 'Unable to analyze bio' };
  }

  private async analyzeProfileImages(
    imagePaths: string[],
    prefs: UserPreferences
  ): Promise<{ score: number; reasoning: string; bestImageUrl?: string }> {
    console.log('📸 analyzeProfileImages called with:', imagePaths);

    if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
      console.log('⚠️  No images array or empty array');
      return { score: 0.5, reasoning: 'No images available' };
    }

    try {
      // Take up to 4 images as requested
      const imagesToAnalyze = imagePaths.filter(path => path && typeof path === 'string').slice(0, 4);

      if (imagesToAnalyze.length === 0) {
        return { score: 0.5, reasoning: 'No valid images found' };
      }

      // Check if images are URLs or local paths
      const isUrl = (path: string) => path.startsWith('http://') || path.startsWith('https://');

      // If they're URLs, use them directly. If local files, convert to base64
      const imageContents = imagesToAnalyze.map(filepath => {
        if (isUrl(filepath)) {
          console.log('📷 Using URL directly:', filepath);
          return filepath;
        } else {
          console.log('📷 Reading local file:', filepath);
          const buffer = fs.readFileSync(filepath);
          console.log(`   File size: ${buffer.length} bytes`);
          const base64 = buffer.toString('base64');

          // Detect image type from extension
          const ext = path.extname(filepath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
          };
          const mimeType = mimeTypes[ext] || 'image/jpeg';
          console.log(`   MIME type: ${mimeType}, base64 length: ${base64.length}`);

          return `data:${mimeType};base64,${base64}`;
        }
      });

      console.log(`✅ Prepared ${imageContents.length} images for OpenAI`);

      const prompt = `You are a dating profile photo analyzer. Rate these photos' overall appeal for a dating profile.

MANDATORY FACE REQUIREMENT:
- First, check if the person's FACE is clearly visible in at least ONE image
- If face is NOT visible in ANY image (hidden, obscured, blurry, turned away, covered by objects/hands, or cut off) → return score: 0
- If face IS NOT clearly visible, STOP analysis immediately and return score 0

SCORING CRITERIA (only if face is clearly visible in at least one image):
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
  "bestImageIndex": <index of best photo from 0 to ${imagesToAnalyze.length - 1}>,
  "reasoning": "<brief objective analysis based on the criteria>"
}`;

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

      console.log('🤖 Calling OpenAI Vision API...');
      const response = await this.client.chat.completions.create({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 500,
        response_format: { type: 'json_object' },
        messages
      });

      console.log('✅ OpenAI API responded');
      const content = response.choices[0].message.content;
      if (content) {
        console.log('📊 Parsing response...');
        const result = JSON.parse(content);
        console.log(`   Score: ${result.score}`);
        return {
          score: result.score,
          reasoning: result.reasoning,
          bestImageUrl: imagesToAnalyze[result.bestImageIndex] || imagesToAnalyze[0]
        };
      } else {
        console.error('⚠️  OpenAI returned empty content');
      }
    } catch (error) {
      console.error('❌ Error analyzing images:', error);
      if (error instanceof Error) {
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        if (error.stack) {
          console.error('   Error stack:', error.stack.split('\n').slice(0, 3).join('\n'));
        }
      }
    }

    return { score: 0.5, reasoning: 'Unable to analyze images' };
  }

  async analyzeAndScore(
    pageText: string,
    imageUrls: string[],
    prefs: UserPreferences
  ): Promise<SwipeDecision & { extractedProfile: Profile }> {
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
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.choices[0].message.content;

      if (content) {
        const result = JSON.parse(content);

        const profile: Profile = {
          id: Date.now().toString(),
          name: result.name,
          age: result.age,
          bio: result.bio || '',
          distance: 5,
          interests: []
        };

        // NOW score using images (100% weight)
        const decision = await this.scoreProfile(profile, prefs, imageUrls);

        return {
          ...decision,
          extractedProfile: profile
        };
      }
    } catch (error) {
      console.error('Error analyzing profile:', error);
    }

    // Fallback
    const fallbackProfile: Profile = {
      id: Date.now().toString(),
      name: 'Unknown',
      age: 25,
      bio: '',
      distance: 5,
      interests: []
    };

    return {
      profile: fallbackProfile,
      extractedProfile: fallbackProfile,
      score: 4,
      action: 'LEFT',
      reasoning: 'Unable to analyze profile'
    };
  }

  async scoreProfile(
    profile: Profile,
    prefs: UserPreferences,
    imageUrls: string[] = []
  ): Promise<SwipeDecision> {
    const imageResult = await this.analyzeProfileImages(imageUrls, prefs);

    // Image score is already 0-10
    let totalScore = imageResult.score;

    // Subtract 2 points if NO bio present (empty or very short)
    const hasBio = profile.bio && profile.bio.trim().length > 10;
    if (!hasBio) {
      totalScore = Math.max(0, totalScore - 2);
    }

    const action = totalScore >= 7.0 ? 'RIGHT' : 'LEFT';

    const reasoning = hasBio
      ? `${imageResult.reasoning}`
      : `${imageResult.reasoning} (no bio: -2 pts)`;

    return {
      profile,
      score: Math.round(totalScore * 10) / 10,
      action,
      reasoning,
      bestImageUrl: imageResult.bestImageUrl
    };
  }
}
