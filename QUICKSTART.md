# Tinder Agent - Quick Start Guide 🚀

## ✅ Installation Complete!

The CLI is now globally available as `tinder-agent`.

---

## 🎯 All Commands

```bash
tinder-agent --help              # Show all commands
tinder-agent swipe-right         # Manual right swipe
tinder-agent swipe-left          # Manual left swipe
tinder-agent analyze             # Analyze without swiping
tinder-agent auto-swipe          # Auto-swipe with AI
```

---

## 🔧 Prerequisites (One-Time Setup)

### 1. Install agent-browser
```bash
npm install -g agent-browser
```

### 2. Set API Key
```bash
export OPENAI_API_KEY=your-key-here
```

### 3. Start Chrome with Debugging
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug
```

### 4. Login to Tinder
Navigate to: https://tinder.com/app/recs

---

## 🚀 Usage Examples

### Manual Swipes
```bash
tinder-agent swipe-right    # Swipe right on current profile
tinder-agent swipe-left     # Swipe left on current profile
```

### Analyze (No Swipe)
```bash
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
# Basic (20 profiles, score >= 7)
tinder-agent auto-swipe --skip-preferences

# Custom (50 profiles, score >= 8)
tinder-agent auto-swipe --limit 50 --min-score 8 --skip-preferences

# Fast mode (reduced delays)
tinder-agent auto-swipe --limit 100 --auto --skip-preferences
```

---

## ⚙️ Auto-Swipe Options

```
--limit <number>      Number of profiles to process (default: 20)
--min-score <number>  Minimum score to swipe right 1-10 (default: 7)
--auto                Fast mode with reduced delays (2s vs 3s)
--skip-preferences    Skip preference collection, use defaults
```

---

## 🎨 How It Works

```
1. Browser Tools → Get page text + images
2. Analyzer → Extract profile info (GPT-4o-mini)
3. Analyzer → Analyze images (Vision API)
4. Score → Calculate final score (0-10)
5. Decision → Swipe right if >= 7.0, left otherwise
6. Browser Tools → Execute swipe
7. CSV Export → Save results
```

### Scoring Logic
- **Vision API** analyzes face + attractiveness → 0-10 score
- **No bio?** → -2 points
- **Final score >= 7.0** → Swipe RIGHT ❤️
- **Final score < 7.0** → Swipe LEFT ❌

---

## 💰 API Costs

Per profile:
- Profile extraction: ~$0.0001
- Image analysis (4 images): ~$0.003
- **Total: ~$0.003 per profile**

Examples:
- 50 profiles = $0.15
- 100 profiles = $0.30

---

## 📊 Output Files

After running auto-swipe:
- **`tinder_profiles.csv`** - All decisions with scores and reasoning
- **`profile_images/`** - Downloaded profile images (named: Name_Age_timestamp_index.jpg)

---

## 🔥 Quick Test

```bash
# 1. Verify CLI works
tinder-agent --help

# 2. Analyze one profile (no swipe)
tinder-agent analyze

# 3. Auto-swipe 5 profiles (test)
tinder-agent auto-swipe --limit 5 --skip-preferences
```

---

## 🛠️ Dev Workflow

### Fast Iteration (No Build)
```bash
# Run TypeScript directly with tsx
npx tsx src/index.ts auto-swipe --limit 10
```

### After Code Changes
```bash
npm run build        # Rebuild
npm link --force     # Relink globally
```

---

## 🐛 Troubleshooting

### "command not found: tinder-agent"
```bash
npm link --force
chmod +x dist/index.js
```

### "OPENAI_API_KEY not set"
```bash
export OPENAI_API_KEY=sk-...
```

### "Browser command failed"
```bash
# Check agent-browser can connect
agent-browser --auto-connect snapshot

# Check Chrome is running on port 9222
lsof -i :9222
```

### Changes not reflecting
```bash
npm run build
npm link --force
```

---

## 📚 Documentation

- **README.md** - Main documentation
- **ARCHITECTURE.md** - Code structure explanation
- **PROGRESS.md** - Complete feature list

---

## 🎉 Ready to Go!

```bash
# Start auto-swiping with AI
tinder-agent auto-swipe --limit 20 --skip-preferences
```

Happy swiping! 🔥❤️

---

## 🧠 Architecture Recap

```
CLI Layer (index.ts)
  ↓
Agent Layer (autoSwiper.ts)
  ↓
Analyzer Layer (analyze.ts)
  ↓
Browser Tools (agentBrowser.ts)
```

Each layer is **clean and separate**:
- **Browser Tools** - Pure browser automation
- **Analyzer** - LLM analysis (no browser logic)
- **Agent** - Orchestrates the loop
- **CLI** - User commands
