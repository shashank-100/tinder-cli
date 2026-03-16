#!/bin/bash

# Pure agent-browser commands to extract Tinder profile images

echo "Step 1: Get snapshot..."
echo "======================================"
agent-browser --cdp http://localhost:9222 snapshot -i | head -30

echo ""
echo ""
echo "Step 2: Find photo region reference..."
echo "======================================"
SNAPSHOT=$(agent-browser --cdp http://localhost:9222 snapshot -i)
# Match either "photos" or "photo" (singular or plural)
PHOTOS_REF=$(echo "$SNAPSHOT" | grep -i 'photo' | grep 'region' | grep -o 'ref=e[0-9]*' | head -1 | sed 's/ref=/@/')
echo "Photo region reference: $PHOTOS_REF"

echo ""
echo ""
echo "Step 3: Get HTML of photos region..."
echo "======================================"
HTML=$(agent-browser --cdp http://localhost:9222 get html "$PHOTOS_REF")
echo "HTML length: ${#HTML}"
echo "First 500 chars: ${HTML:0:500}"

echo ""
echo ""
echo "Step 4: Extract image URLs from background-image styles..."
echo "======================================"
# Use sed to extract and decode &amp; to &
echo "$HTML" | grep -o 'background-image: url(&quot;https://[^)]*&quot;)' | sed 's/background-image: url(&quot;//' | sed 's/&quot;)//' | sed 's/&amp;/\&/g' | head -4
