import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * TOOL LAYER: Pure browser automation functions
 * These functions interact directly with the browser via agent-browser
 * No business logic - just browser actions
 */
export class AgentBrowserControl {
  private browserCmd = 'agent-browser --auto-connect';

  /**
   * Execute agent-browser command
   */
  private async run(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`${this.browserCmd} ${command}`);
      if (stderr && typeof stderr === 'string' && stderr.includes('✗')) {
        throw new Error(stderr);
      }
      return stdout ? stdout.trim() : '';
    } catch (error) {
      throw new Error(`Browser command failed: ${error}`);
    }
  }

  /**
   * TOOL: Get raw page text
   */
  async getPageText(): Promise<string> {
    const result = await this.run(`eval "document.body.innerText"`);
    return result || '';
  }

  /**
   * TOOL: Swipe right (LIKE)
   */
  async swipeRight(): Promise<void> {
    const snapshot = await this.run('snapshot -i');
    const likeMatch = snapshot.match(/button "LIKE".*?\[ref=(e\d+)\]/);

    if (!likeMatch) {
      throw new Error('LIKE button not found');
    }

    await this.run(`click @${likeMatch[1]}`);
    console.log(`✅ Swiped RIGHT`);
  }

  /**
   * TOOL: Swipe left (NOPE)
   */
  async swipeLeft(): Promise<void> {
    const snapshot = await this.run('snapshot -i');
    const nopeMatch = snapshot.match(/button "NOPE".*?\[ref=(e\d+)\]/);

    if (!nopeMatch) {
      throw new Error('NOPE button not found');
    }

    await this.run(`click @${nopeMatch[1]}`);
    console.log(`✅ Swiped LEFT`);
  }

  /**
   * TOOL: Get profile image URLs
   */
  async getProfileImages(): Promise<string[]> {
    const html = await this.run('get html body');
    const urlPattern = /background-image:\s*url\(&quot;(https:\/\/images[^&]*?gotinder\.com[^&]*?)&quot;\)/g;
    const urls: string[] = [];
    const seen = new Set<string>();
    let match;

    while ((match = urlPattern.exec(html)) !== null && urls.length < 4) {
      const url = match[1];
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * TOOL: Wait for next profile to load
   */
  async nextProfile(waitTime: number = 3000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  /**
   * TOOL: Check if profile is loaded
   */
  async isProfileLoaded(): Promise<boolean> {
    const snapshot = await this.run('snapshot -i');
    return snapshot.includes('button "NOPE"') && snapshot.includes('button "LIKE"');
  }

  /**
   * TOOL: Open Tinder
   */
  async openTinder(): Promise<void> {
    await this.run('open https://tinder.com/app/recs');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}
