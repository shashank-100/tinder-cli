# Tinder Agent 🤖❤️

AI-powered Tinder automation agent with **clean architecture** and **Vision API** analysis.

## Features

- ✅ **4 CLI Commands** - Manual swipes, analysis, and auto-swipe
- 🤖 **Vision API Analysis** - GPT-4o-mini analyzes profile images for attractiveness
- 🎯 **Smart Filtering** - Min score threshold, duplicate detection
- 📊 **Face Detection** - Rejects profiles with no visible face
- 🎨 **Beautiful CLI** - Clean, colorful terminal output
- 📈 **CSV Export** - Save all decisions with downloaded images
- ⚡ **Fast Automation** - Uses agent-browser for real Chrome control
- 🏗️ **Clean Architecture** - Separated layers: CLI → Agent → Analyzer → Browser Tools

## Quick Start

### Prerequisites

```bash
# 1. Install agent-browser globally
npm install -g agent-browser

# 2. Set OpenAI API key
export OPENAI_API_KEY=your-key-here

# 3. Start Chrome with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug

# 4. Login to Tinder in Chrome
# Navigate to https://tinder.com/app/recs
```

### Installation

```bash
npm install
npm run build
```

## Commands

### Manual Swipes

```bash
# Swipe right on current profile
tinder-agent swipe-right

# Swipe left on current profile
tinder-agent swipe-left
```

### Analyze (No Swipe)

```bash
# Get AI recommendation without swiping
tinder-agent analyze
```

**Output:**
```
============================================================
Sarah, 25
Loves hiking and coffee ☕

Score: 8.5/10
Reasoning: Clear face visible, attractive, good grooming

✓ Recommendation: Swipe Right ❤️
============================================================
```

### Auto-Swipe

```bash
# Process 20 profiles, swipe right if score >= 7
tinder-agent auto-swipe --skip-preferences

# Custom settings
tinder-agent auto-swipe --limit 50 --min-score 8 --skip-preferences

# Fast mode (2s delays)
tinder-agent auto-swipe --limit 100 --auto --skip-preferences
```

### Options

```
--limit <number>      Number of profiles (default: 20)
--min-score <number>  Min score to swipe right 1-10 (default: 7)
--auto                Auto mode with reduced delays
--skip-preferences    Skip preference collection
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
