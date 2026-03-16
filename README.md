# Tinder Agentic CLI

An AI-powered Tinder automation agent that uses GPT-5 to intelligently evaluate profiles and make swiping decisions based on your preferences. **Now with REAL Tinder integration!**

## Features

- ✅ **Real Tinder Integration**: Connects to actual Tinder using browser automation
- 🤖 **Intelligent Profile Scoring**: Uses GPT-5 mini to analyze bios and compatibility
- 🎯 **Customizable Preferences**: Set your type, age range, distance, and interests
- 📊 **Multi-factor Scoring**: Combines interest match, age compatibility, distance, and bio analysis
- 🎨 **Beautiful CLI Interface**: Clean, colorful terminal output with progress indicators
- 📈 **Swipe History**: Tracks decisions and provides session summaries
- ⚡ **Fast Browser Automation**: Uses gstack's /browse skill for 100ms response times
- 🔒 **Persistent Sessions**: Login once, session stays active

## Installation

```bash
npm install
npm run build
```

## Setup

1. Get your Anthropic API key from https://console.anthropic.com/
2. Set your API key:

```bash
export ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

### Usage

**Prerequisites**:
1. Open Chrome normally (your regular Chrome with all your logins)
2. Navigate to https://tinder.com/app/recs and make sure you're logged in
3. Leave Chrome open

Then run the agent:

```bash
# Process 20 profiles (default)
npm start

# Process 3 profiles (test)
npm start -- --limit 3

# Skip preferences (use defaults)
npm start -- --skip-preferences --limit 5

# Fast mode (no delays)
npm start -- --auto --limit 10
```

The agent will connect to your running Chrome and use your existing Tinder session!

This will:
1. Ask for your preferences (type, age range, distance, interests)
2. Connect to your Tinder session
3. Process profiles with AI scoring
4. Auto-swipe based on compatibility
5. Show you a summary with top matches

### Command Options

```bash
# Use default preferences
node dist/index.js start --skip-preferences

# Fast mode (no delays between swipes)
node dist/index.js start --auto

# Limit number of profiles
node dist/index.js start --limit 50

# Test with mock profiles (no real Tinder)
node dist/index.js start --mock
```

### Test Mode (Mock Profiles)

```bash
npm test
```

## How It Works

### Scoring Algorithm

Each profile receives a score from 0-10 based on:

- **35%** Interest Match - Overlap with your interests
- **25%** Age Match - Fit within your age range
- **20%** Distance Score - Proximity to you
- **20%** Bio Similarity - Claude analyzes bio compatibility

**Swipe Decision**: Score >= 7.0 = Right Swipe ❤️, Score < 7.0 = Left Swipe ❌

### Preference Matching

The agent learns your preferences and applies them consistently:

- **Type**: Personality/lifestyle descriptors (athletic, tech, creative)
- **Age Range**: Min and max age preferences
- **Distance**: Maximum distance in kilometers
- **Interests**: Keywords you're looking for

### Claude Integration

Claude analyzes each profile's bio to:
- Evaluate personality alignment
- Identify green/red flags
- Provide reasoning for scores
- Consider vibe and compatibility

## Project Structure

```
src/
├── index.ts           # CLI entry point
├── agent.ts           # Main agent logic
├── preferences.ts     # Preference collection
├── scorer.ts          # Profile scoring engine
├── mockData.ts        # Test profiles
└── types.ts           # TypeScript interfaces
```

## Example Output

```
🤖 Let's set up your preferences!

? What type of people do you prefer? athletic, tech, creative
? Minimum age? 23
? Maximum age? 30
? Maximum distance (km)? 20
? What interests are you looking for? startup, AI, travel

✅ Preferences saved!

🔥 Starting Tinder Agent...

Processing 10 profiles...

============================================================

Sarah, 26
5km away

AI researcher by day, marathon runner by night. Building the future one model at a time.

Interests: AI, running, tech, coffee

⠹ Analyzing profile...

Score: 8.9/10
Reasoning: Strong alignment with tech/AI interests and athletic lifestyle

✓ Action: Swipe Right ❤️
============================================================
```

## Advanced Features (Future)

- **Memory**: Agent learns from your swipes over time
- **Vision**: Analyze profile photos
- **Auto-messaging**: Generate personalized openers
- **Real Tinder Integration**: Connect to actual Tinder API

## License

ISC
