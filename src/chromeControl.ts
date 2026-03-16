import { exec } from 'child_process';
import { promisify } from 'util';
import { Profile } from './types.js';

const execAsync = promisify(exec);

export class ChromeTinderControl {
  private async runAppleScript(script: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript failed: ${error}`);
    }
  }

  async getCurrentProfile(): Promise<Profile | null> {
    // Use AppleScript to execute JavaScript in Chrome to get profile data
    const script = `
      tell application "Google Chrome"
        tell active tab of window 1
          set profileData to execute javascript "
            const nameEl = document.querySelector('[itemprop=\\"name\\"]');
            const ageEl = document.querySelector('[itemprop=\\"age\\"]');
            const bioEl = document.querySelector('.Px\\\\(16px\\\\)');
            JSON.stringify({
              name: nameEl?.textContent || 'Unknown',
              age: ageEl?.textContent || '25',
              bio: bioEl?.textContent || '',
              distance: '5'
            });
          "
          return profileData
        end tell
      end tell
    `;

    try {
      const result = await this.runAppleScript(script);
      const data = JSON.parse(result);

      return {
        id: Date.now().toString(),
        name: data.name,
        age: parseInt(data.age) || 25,
        bio: data.bio,
        distance: parseInt(data.distance) || 5,
        interests: this.extractInterests(data.bio)
      };
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  private extractInterests(bio: string): string[] {
    const keywords = ['AI', 'tech', 'startup', 'travel', 'fitness', 'yoga', 'music', 'art', 'food', 'coffee'];
    return keywords.filter(k => bio.toLowerCase().includes(k.toLowerCase()));
  }

  async swipeRight(): Promise<void> {
    const script = `
      tell application "Google Chrome"
        tell active tab of window 1
          execute javascript "
            const likeBtn = document.querySelector('[aria-label=\\"Like\\"]') ||
                           document.querySelector('button[aria-label*=\\"Like\\"]');
            if (likeBtn) likeBtn.click();
            else document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight'}));
          "
        end tell
      end tell
    `;
    await this.runAppleScript(script);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async swipeLeft(): Promise<void> {
    const script = `
      tell application "Google Chrome"
        tell active tab of window 1
          execute javascript "
            const nopeBtn = document.querySelector('[aria-label=\\"Nope\\"]') ||
                           document.querySelector('button[aria-label*=\\"Nope\\"]');
            if (nopeBtn) nopeBtn.click();
            else document.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowLeft'}));
          "
        end tell
      end tell
    `;
    await this.runAppleScript(script);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async ensureTinderTab(): Promise<void> {
    const script = `
      tell application "Google Chrome"
        activate
        set tinderFound to false
        repeat with w in windows
          set tabIndex to 1
          repeat with t in tabs of w
            if URL of t contains "tinder.com/app" then
              set active tab index of w to tabIndex
              set index of w to 1
              set tinderFound to true
              return "Found Tinder tab"
            end if
            set tabIndex to tabIndex + 1
          end repeat
        end repeat

        if not tinderFound then
          tell window 1 to make new tab with properties {URL:"https://tinder.com/app/recs"}
          return "Created new Tinder tab"
        end if
      end tell
    `;
    await this.runAppleScript(script);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}
