# tinder-agent 🤖❤️

AI-powered Tinder automation CLI. Uses real Chrome browser control + GPT-4o Vision to analyze and swipe profiles automatically.

## How It Works

```
Chrome (port 9222)
       ↓
agent-browser       ← clicks photo tabs, reads snapshot
       ↓
GPT-4o-mini Vision  ← scores profile images 0–10
       ↓
swipe right / left  ← based on score threshold
```

## Prerequisites

**1. Chrome with remote debugging**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

**2. agent-browser CLI**
```bash
npm install -g agent-browser
```

**3. OpenAI API key**
```bash
export OPENAI_API_KEY=your-key-here
```

**4. Log into Tinder in that Chrome window**
Navigate to `https://tinder.com/app/recs`

## Installation

```bash
npm install
npm run build
npm link   # makes tinder-agent available globally
```

## Commands

### Analyze current profile
```bash
tinder-agent analyze
```
Shows score, reasoning, and recommendation — no swipe.

```
============================================================
Priya, 24
coffee addict + dog mom

Score: 8.2/10
Reasoning: Clear face, good grooming, confident expression

✓ Recommendation: Swipe Right ❤️
============================================================
```

### Swipe manually
```bash
tinder-agent swipe-right
tinder-agent swipe-left
```

### Auto-swipe
```bash
tinder-agent auto-swipe               # 20 profiles, min score 7
tinder-agent auto-swipe --limit 50    # 50 profiles
tinder-agent auto-swipe --min-score 8 # stricter threshold
```

```
[1/20] Waiting for profile...
📸 Found 4 images

============================================================
Anya, 26
(no bio)

Score: 6.1/10
Reasoning: Face visible but partially obscured, average presentation

✗ Swipe Left ❌
============================================================

📊 Summary
❤️  Right: 6
❌ Left: 14
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--limit` | 20 | Number of profiles to process |
| `--min-score` | 7 | Minimum score (0–10) to swipe right |

## Scoring

GPT-4o-mini Vision evaluates each profile's photos:

- **No face visible** → score 0 (auto swipe left)
- **Face visible** → scored 1–10 based on attractiveness, grooming, confidence
- **Score ≥ min-score** → swipe right
- **Score < min-score** → swipe left

## Project Structure

```
src/
├── index.ts          # CLI commands (swipe-right, swipe-left, analyze, auto-swipe)
├── agentBrowser.ts   # Browser automation (snapshots, clicks, image extraction)
└── analyze.ts        # GPT-4o Vision analysis
```

## License

ISC
