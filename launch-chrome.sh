#!/bin/bash

echo "🔄 Restarting Chrome with remote debugging..."

# Close all Chrome windows
osascript -e 'quit app "Google Chrome"' 2>/dev/null
pkill -f "Google Chrome" 2>/dev/null
sleep 3

# Launch Chrome with remote debugging enabled - use full path
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  "https://tinder.com/app/recs" > /dev/null 2>&1 &

sleep 4

echo ""
echo "✅ Chrome launched with remote debugging!"
echo "📱 Tinder should be opening..."
echo ""
echo "Now run: npm start -- --limit 3"
