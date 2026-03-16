import 'dotenv/config';
import { ProfileScorer } from './src/scorer.js';

async function testScorer() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('No OPENAI_API_KEY found!');
    process.exit(1);
  }

  const scorer = new ProfileScorer(apiKey);

  // Test with actual local image path from CSV
  const testImagePath = '/Users/shashank/tinder-cli/profile_images/Niya_24_1773639912153_1.jpg';

  const mockProfile = {
    id: '1',
    name: 'Niya',
    age: 24,
    bio: 'Hi, my name is Nitya. Here are some of my favorite things: Disney, Movies, Coffee.\nFun and hook-ups kinda yaak men's please don't text.',
    distance: 5,
    interests: []
  };

  const mockPrefs = {
    type: ['attractive', 'fun'],
    ageRange: { min: 20, max: 30 },
    distance: 50,
    interests: ['movies', 'coffee']
  };

  console.log('Testing scorer with local image...\n');
  console.log(`Image path: ${testImagePath}\n`);

  const result = await scorer.scoreProfile(mockProfile, mockPrefs, [testImagePath]);

  console.log('✅ Result:');
  console.log(`   Score: ${result.score}`);
  console.log(`   Action: ${result.action}`);
  console.log(`   Reasoning: ${result.reasoning}`);
}

testScorer();
