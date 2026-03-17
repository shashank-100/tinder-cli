# Tinder Agent Architecture

## Overview
The codebase follows a clean **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         CLI Layer (index.ts)            │  ← User commands
├─────────────────────────────────────────┤
│     Agent Layer (autoSwiper.ts)         │  ← Business logic / Loop
├─────────────────────────────────────────┤
│    Analysis Layer (analyze.ts)          │  ← LLM intelligence
├─────────────────────────────────────────┤
│  Browser Tool Layer (agentBrowser.ts)   │  ← Browser automation
└─────────────────────────────────────────┘
```

---

## Layer 1: CLI (index.ts)

**Purpose:** User interface - command definitions

**Commands:**
- `tinder-agent swipe-right` - Manual right swipe
- `tinder-agent swipe-left` - Manual left swipe
- `tinder-agent analyze` - Analyze current profile
- `tinder-agent auto-swipe --limit 50 --min-score 7` - Auto-swipe loop

**Responsibilities:**
- Parse command-line arguments
- Validate environment variables
- Route commands to appropriate layers
- Handle errors and display messages

**Example:**
```bash
tinder-agent auto-swipe --limit 50 --min-score 7 --skip-preferences
```

---

## Layer 2: Agent (autoSwiper.ts)

**Purpose:** Orchestrates the auto-swipe loop

**Key Functions:**
- `run(preferences, options)` - Main auto-swipe loop
- `waitForProfile()` - Wait for profile to load with timeout
- `displayProfile()` - Format and display results
- `displaySummary()` - Show session statistics

**Loop Logic:**
```typescript
for (let i = 0; i < limit; i++) {
  // 1. Wait for profile to load
  await waitForProfile()

  // 2. Get raw data from browser
  const pageText = await browser.getPageText()
  const images = await browser.getProfileImages()

  // 3. Download images locally
  const localPaths = await csvExporter.downloadImages(images, name, age)

  // 4. Analyze with LLM
  const result = await analyzer.analyze(pageText, localPaths, prefs)

  // 5. Check duplicate
  if (seenProfiles.has(profileKey)) continue

  // 6. Execute swipe
  if (result.action === 'RIGHT') {
    await browser.swipeRight()
  } else {
    await browser.swipeLeft()
  }

  // 7. Save to CSV
  await csvExporter.saveProfile(result, localPaths)

  // 8. Wait before next
  await browser.nextProfile(waitTime)
}
```

---

## Layer 3: Analysis (analyze.ts)

**Purpose:** LLM-powered profile analysis (pure logic, no browser interaction)

**Key Functions:**

### `analyze(pageText, imagePaths, preferences)`
Main analysis function that:
1. Extracts profile data from text
2. Analyzes images using Vision API
3. Calculates final score
4. Returns decision (RIGHT/LEFT)

### `extractProfile(pageText)`
Uses GPT-4o-mini to extract:
- Name
- Age
- Bio

### `analyzeImages(imagePaths)`
Uses Vision API to evaluate:
- **Face visibility** (reject if no face)
- **Attractiveness** (1-10 scale)

**Scoring Rules:**
```
Image score: 0-10
If no bio: -2 points
If score >= 7.0: Swipe RIGHT
Otherwise: Swipe LEFT
```

**Vision Prompt:**
```
1. FACE VISIBILITY
   - No face → score: 0

2. ATTRACTIVENESS
   - Rate 1-10 based on:
     - Facial symmetry
     - Grooming
     - Confidence
     - Overall presentation
```

---

## Layer 4: Browser Tools (agentBrowser.ts)

**Purpose:** Pure browser automation (NO business logic)

**Core Functions:**

### `swipeRight(): void`
```typescript
1. Get snapshot
2. Find LIKE button ref
3. Click button
4. Log success
```

### `swipeLeft(): void`
```typescript
1. Get snapshot
2. Find NOPE button ref
3. Click button
4. Log success
```

### `getProfileImages(): string[]`
```typescript
1. Get HTML from page
2. Regex extract Tinder image URLs
3. Return up to 4 unique URLs
```

### `getPageText(): string`
```typescript
1. Evaluate document.body.innerText
2. Return raw text
```

### `nextProfile(waitTime): void`
```typescript
Wait N milliseconds for next profile to load
```

### `isProfileLoaded(): boolean`
```typescript
Check if NOPE and LIKE buttons exist
```

### `openTinder(): void`
```typescript
Navigate to https://tinder.com/app/recs
```

---

## Data Flow

```
User runs command
    ↓
index.ts parses args
    ↓
autoSwiper.run() starts loop
    ↓
    ┌─→ agentBrowser.getPageText()
    │   agentBrowser.getProfileImages()
    │       ↓
    │   csvExporter.downloadImages()
    │       ↓
    │   analyzer.analyze()
    │       ├─→ analyzer.extractProfile()  (GPT-4o-mini)
    │       └─→ analyzer.analyzeImages()   (Vision API)
    │           ↓
    │       returns { score, action, name, age, bio, reasoning }
    │       ↓
    │   Check duplicate
    │       ↓
    │   if (action === 'RIGHT')
    │       agentBrowser.swipeRight()
    │   else
    │       agentBrowser.swipeLeft()
    │       ↓
    │   csvExporter.saveProfile()
    │       ↓
    └─ agentBrowser.nextProfile()
```

---

## File Structure

```
tinder-agent/
├── src/
│   ├── index.ts              # CLI entry point
│   │                         # Commands: swipe-right, swipe-left,
│   │                         #           analyze, auto-swipe
│   │
│   ├── autoSwiper.ts         # Auto-swipe agent
│   │                         # Main loop orchestration
│   │
│   ├── analyze.ts            # LLM analysis layer
│   │                         # Vision API integration
│   │
│   ├── agentBrowser.ts       # Browser tool layer
│   │                         # Pure browser automation
│   │
│   ├── preferences.ts        # User preference collection
│   ├── csvExporter.ts        # CSV export + image download
│   ├── types.ts              # TypeScript interfaces
│   │
│   └── [Legacy files - not used]
│       ├── agent.ts          # Old agent class
│       ├── scorer.ts         # Old scoring logic
│       ├── tinderBrowser.ts  # Old browser control
│       └── chromeControl.ts  # Old Chrome control
│
├── dist/                     # Compiled JavaScript
├── profile_images/           # Downloaded profile images
├── tinder_profiles.csv       # Exported results
├── ARCHITECTURE.md           # This file
├── PROGRESS.md              # Progress tracking
└── package.json
```

---

## Key Design Principles

### 1. **Separation of Concerns**
Each layer has ONE responsibility:
- CLI: User interface
- Agent: Business logic
- Analyzer: LLM intelligence
- Browser: Automation primitives

### 2. **Pure Functions**
Browser tools are pure - no side effects except browser actions:
```typescript
// ✅ Good - pure browser action
async swipeRight(): Promise<void>

// ❌ Bad - mixed with business logic
async swipeRightIfScoreAbove7(profile, preferences): Promise<void>
```

### 3. **Testable**
Each layer can be tested independently:
- Mock browser for agent tests
- Mock analyzer for agent tests
- Test analyzer without browser

### 4. **Reusable**
Tools can be used by different commands:
```typescript
// Manual swipe command uses same tool
tinder-agent swipe-right  → browser.swipeRight()

// Auto-swipe uses same tool
auto-swipe loop → browser.swipeRight()
```

---

## Usage Examples

### Basic Commands

```bash
# Manual swipes
tinder-agent swipe-right
tinder-agent swipe-left

# Analyze without swiping
tinder-agent analyze

# Auto-swipe with defaults (20 profiles, score >= 7)
tinder-agent auto-swipe --skip-preferences

# Auto-swipe with custom settings
tinder-agent auto-swipe --limit 50 --min-score 8 --skip-preferences

# Fast auto-swipe (no delays)
tinder-agent auto-swipe --limit 100 --auto --skip-preferences
```

### With Preferences

```bash
# Interactive preference collection
tinder-agent auto-swipe --limit 30

# Will prompt for:
# - Type (attractive, intelligent, funny, etc.)
# - Age range
# - Max distance
# - Interests
```

---

## API Keys & Environment

Required:
```bash
export OPENAI_API_KEY=your-key-here
```

External Dependencies:
```bash
# Install agent-browser globally
npm install -g agent-browser

# Start Chrome with debugging
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

---

## Extension Points

### Add New Commands
Edit `src/index.ts`:
```typescript
program
  .command('my-command')
  .description('My custom command')
  .action(async () => {
    const browser = new AgentBrowserControl()
    // Use browser tools
    await browser.swipeRight()
  })
```

### Add New Browser Tools
Edit `src/agentBrowser.ts`:
```typescript
async myNewTool(): Promise<string> {
  return await this.run('some agent-browser command')
}
```

### Customize Scoring
Edit `src/analyze.ts`:
```typescript
// Modify scoring logic in analyze()
let finalScore = imageAnalysis.score
// Add your custom adjustments
if (someCondition) finalScore += 1
```

---

## Performance Notes

### Wait Times
- Profile loading: 15s max timeout
- After swipe: 3s (normal) or 2s (auto mode)
- Initial Tinder load: 3s

### API Costs (per profile)
- 1x GPT-4o-mini call for profile extraction (~$0.0001)
- 1x Vision API call for 4 images (~$0.003)
- **Total: ~$0.003 per profile**

### Rate Limiting
Currently NO rate limiting - use `--auto` mode carefully to avoid:
- Tinder ban detection
- API rate limits
- Excessive API costs

**Recommended:**
- Max 100 profiles per session
- Use delays (avoid `--auto` for large batches)
- Monitor API usage

---

## Troubleshooting

### "LIKE button not found"
- Profile not loaded yet - increase wait time
- Check Chrome is on Tinder page
- Try `tinder-agent analyze` to debug

### "OPENAI_API_KEY not set"
```bash
export OPENAI_API_KEY=sk-...
```

### "Browser command failed"
- Ensure Chrome running with `--remote-debugging-port=9222`
- Check `agent-browser` installed globally
- Try connecting manually: `agent-browser --auto-connect snapshot`

### Duplicate profiles
- Normal - Tinder reshows profiles sometimes
- Agent skips duplicates automatically
- Breaks after too many consecutive duplicates

---

**Last Updated:** 2026-03-17
**Version:** 2.0 (Refactored Clean Architecture)
