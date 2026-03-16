# Tinder CLI - Quick Start

## How to Use

1. **Open your regular Chrome browser**
2. **Go to https://tinder.com/app/recs** (make sure you're logged in)
3. **Leave Chrome open**
4. **Run the agent:**
```bash
# Process 20 profiles (default)
npm start

# Process 3 profiles (test)
npm start -- --limit 3

# Skip preference questions
npm start -- --skip-preferences --limit 5

# Fast mode (no delays)
npm start -- --auto --limit 10
```

## How It Works

1. **Connects** to your logged-in Chrome browser
2. **Extracts** profile data (name, age, bio, photos)
3. **Downloads** up to 4 images per profile
4. **Analyzes** attractiveness using GPT-5 Vision
5. **Scores** 0-10 (checks face visibility first!)
6. **Deducts** 2 points if no bio
7. **Swipes** RIGHT if score ≥ 7.0, LEFT otherwise
8. **Saves** all results to CSV

## Scoring Logic

- **Face not visible** → Score: 0 → LEFT
- **Score < 7.0** → LEFT
- **Score ≥ 7.0** → RIGHT ❤️
- **No bio penalty** → -2 points

## Output

- **Console**: Real-time profile analysis
- **CSV**: `tinder_profiles.csv` with all data
- **Images**: `temp/` folder (downloaded locally)
