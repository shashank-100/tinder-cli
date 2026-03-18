import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * TOOL LAYER: Pure browser automation functions
 */
export class AgentBrowserControl {
  private browserCmd = 'agent-browser --auto-connect';

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
   * TOOL: Get profile text directly from snapshot button label
   * e.g. "Lavanya 18 Verified! Open profile Self - obsessed 🥰"
   */
  async getPageText(): Promise<string> {
    const snapshot = await this.run('snapshot -i');
    // Extract the profile button text which has name, age, bio
    const match = snapshot.match(/button "([^"]+Open profile[^"]*)" \[ref/);
    return match ? match[1] : '';
  }

  /**
   * TOOL: Swipe right (LIKE)
   */
  async swipeRight(): Promise<void> {
    const snapshot = await this.run('snapshot -i');
    const likeMatch = snapshot.match(/button "LIKE".*?\[ref=(e\d+)\]/);
    if (!likeMatch) throw new Error('LIKE button not found');
    await this.run(`click @${likeMatch[1]}`);
    console.log(`✅ Swiped RIGHT`);
  }

  /**
   * TOOL: Swipe left (NOPE)
   */
  async swipeLeft(): Promise<void> {
    const snapshot = await this.run('snapshot -i');
    const nopeMatch = snapshot.match(/button "NOPE".*?\[ref=(e\d+)\]/);
    if (!nopeMatch) throw new Error('NOPE button not found');
    await this.run(`click @${nopeMatch[1]}`);
    console.log(`✅ Swiped LEFT`);
  }

  /**
   * TOOL: Get profile images by clicking each photo tab
   * Uses snapshot to find tab refs, clicks each, grabs background image URL
   */
  async getProfileImages(): Promise<string[]> {
    const snapshot = await this.run('snapshot -i');

    // Get photo region ref e.g. region "Vii's photos" [ref=e8]
    const regionMatch = snapshot.match(/region "[^"]*photos[^"]*" \[ref=(e\d+)\]/i);
    if (!regionMatch) return [];
    const regionRef = regionMatch[1];

    // Get all photo tab refs
    const tabRefs = [...snapshot.matchAll(/tab "Photo \d+".*?\[ref=(e\d+)\]/g)]
      .map(m => m[1])
      .slice(0, 4);

    if (tabRefs.length === 0) return [];

    const urls: string[] = [];

    for (const ref of tabRefs) {
      await this.run(`click @${ref}`);
      await new Promise(r => setTimeout(r, 400));

      // Get HTML of the photo region and extract URL via regex in Node
      const html = await this.run(`get html @${regionRef}`);
      const match = html.match(/https:\/\/images[^"'<]+gotinder[^"'<]+/);
      if (match) {
        const url = match[0].replace(/&amp;/g, '&').replace(/&quot;.*$/, '').trim();
        if (url.startsWith('https://') && !urls.includes(url)) {
          urls.push(url);
        }
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
