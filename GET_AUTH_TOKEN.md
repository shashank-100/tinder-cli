# How to Get Your Tinder Auth Token

## Method 1: Chrome DevTools (Easiest)

1. **Open Chrome DevTools**
   - Go to https://tinder.com
   - Press `F12` or `Cmd+Option+I` (Mac)

2. **Go to Network Tab**
   - Click "Network" tab
   - Check "Preserve log"

3. **Filter for API Calls**
   - In the filter box, type: `api.gotinder.com`

4. **Navigate Tinder**
   - Click around on Tinder (view profiles, swipe, etc.)
   - Watch the Network tab

5. **Find Any API Request**
   - Click any request to `api.gotinder.com`
   - Look at "Request Headers"
   - Find: `x-auth-token: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

6. **Copy the Token**
   - Copy the value after `x-auth-token:`
   - Example: `d44c1375-ac4d-4ad6-886a-3f90f3fb3efd`

---

## Method 2: Copy as cURL

1. **Open DevTools Network Tab**
   - Go to https://tinder.com
   - Press `F12` → Network tab

2. **Swipe on a Profile**
   - Swipe left or right on any profile

3. **Find the Pass/Like Request**
   - Look for requests to:
     - `https://api.gotinder.com/pass/...`
     - `https://api.gotinder.com/like/...`

4. **Copy as cURL**
   - Right-click the request
   - Select "Copy" → "Copy as cURL"
   - You'll get all headers including `x-auth-token`

---

## Method 3: Application Storage

1. **Open DevTools**
   - Go to https://tinder.com
   - Press `F12`

2. **Go to Application Tab**
   - Click "Application" (or "Storage" in Firefox)

3. **Check Local Storage**
   - Expand "Local Storage"
   - Click on `https://tinder.com`
   - Look for keys like:
     - `TinderWeb/APIToken`
     - `authToken`
     - Similar auth-related keys

---

## Using the Token

Once you have the token, set it as an environment variable:

```bash
export TINDER_AUTH_TOKEN=d44c1375-ac4d-4ad6-886a-3f90f3fb3efd
```

Or create a `.env` file:

```
TINDER_AUTH_TOKEN=d44c1375-ac4d-4ad6-886a-3f90f3fb3efd
```

---

## Important Notes

⚠️ **Security Warnings:**
- This token gives FULL access to your Tinder account
- Don't share it with anyone
- Don't commit it to GitHub
- Tokens may expire (usually valid for weeks/months)

⚠️ **Token Expiration:**
- If you get 401 errors, your token expired
- Just grab a fresh one using the methods above

---

## Test Your Token

```bash
# Test if token works
curl 'https://api.gotinder.com/v2/recs/core?locale=en-US' \
  -H 'x-auth-token: YOUR_TOKEN_HERE' \
  -H 'platform: web'
```

If you get JSON back (not an error), your token works! ✅

---

## API Endpoints

Once you have a valid token:

```bash
# Get recommendations (profiles to swipe)
GET https://api.gotinder.com/v2/recs/core

# Swipe left (pass)
GET https://api.gotinder.com/pass/{user_id}

# Swipe right (like)
GET https://api.gotinder.com/like/{user_id}

# Get profile details
GET https://api.gotinder.com/user/{user_id}
```

All require header: `x-auth-token: YOUR_TOKEN`
