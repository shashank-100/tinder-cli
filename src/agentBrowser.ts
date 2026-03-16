import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { Profile } from './types.js';

const execAsync = promisify(exec);

export class AgentBrowserControl {
  // Use agent-browser --auto-connect to connect to running Chrome
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

  async getPageText(): Promise<string> {
    try {
      const result = await this.run(`eval "document.body.innerText"`);
      return result || '';
    } catch (error) {
      console.error('Error getting page text:', error);
      return '';
    }
  }

  private extractInterests(bio: string): string[] {
    const keywords = ['AI', 'tech', 'startup', 'travel', 'fitness', 'yoga', 'music', 'art', 'food', 'coffee'];
    return keywords.filter(k => bio.toLowerCase().includes(k.toLowerCase()));
  }

  async swipeRight(): Promise<void> {
    try {
      // Get snapshot and find LIKE button ref
      const snapshot = await this.run('snapshot -i');
      const likeMatch = snapshot.match(/button "LIKE".*?\[ref=(e\d+)\]/);
      if (likeMatch) {
        console.log(`👆 Clicking LIKE button @${likeMatch[1]}`);
        await this.run(`click @${likeMatch[1]}`);
        console.log(`✅ Swiped right successfully`);
        // Wait for animation and next profile to load
        console.log(`⏳ Waiting for next profile...`);
        await new Promise(resolve => setTimeout(resolve, 4000));
      } else {
        console.log(`⚠️  LIKE button not found`);
      }
    } catch (error) {
      console.error('Error swiping right:', error);
    }
  }

  async swipeLeft(): Promise<void> {
    try {
      // Get snapshot and find NOPE button ref
      const snapshot = await this.run('snapshot -i');
      const nopeMatch = snapshot.match(/button "NOPE".*?\[ref=(e\d+)\]/);
      if (nopeMatch) {
        console.log(`👆 Clicking NOPE button @${nopeMatch[1]}`);
        await this.run(`click @${nopeMatch[1]}`);
        console.log(`✅ Swiped left successfully`);
        // Wait for animation and next profile to load
        console.log(`⏳ Waiting for next profile...`);
        await new Promise(resolve => setTimeout(resolve, 4000));
      } else {
        console.log(`⚠️  NOPE button not found`);
      }
    } catch (error) {
      console.error('Error swiping left:', error);
    }
  }

  async getProfileImages(): Promise<string[]> {
    try {
      // Get snapshot to find the photo region
      const snapshot = await this.run('snapshot -i');

      // Match "photo" or "photos" region (can be singular or plural)
      const photosMatch = snapshot.match(/region ".*?photo.*?".*?\[ref=(e\d+)\]/i);
      if (!photosMatch) {
        // Debug: show relevant snapshot lines
        const lines = snapshot.split('\n').filter(l => l.toLowerCase().includes('photo') || l.toLowerCase().includes('image') || l.toLowerCase().includes('region'));
        console.log('🔍 Snapshot debug (photo/image/region lines):', lines.slice(0, 10).join('\n'));

        // Fallback: try to get full page HTML and extract image URLs
        console.log('⚠️  No photo region found, trying full page HTML...');
        const html = await this.run('get html body');
        const urlPattern = /background-image:\s*url\(&quot;(https:\/\/[^&]*images\.gotinder\.com[^&"]*?)(?:&amp;|&quot;)/g;
        const urls: string[] = [];
        let match;
        while ((match = urlPattern.exec(html)) !== null && urls.length < 4) {
          const url = match[1].replace(/&amp;/g, '&');
          urls.push(url);
        }
        if (urls.length > 0) {
          console.log(`📸 Found ${urls.length} images from full page HTML`);
          return urls;
        }
        return [];
      }

      const photosRef = `@${photosMatch[1]}`;

      // Get HTML of photos region
      const html = await this.run(`get html ${photosRef}`);

      // Extract URLs from background-image: url(&quot;...&quot;)
      const urlPattern = /background-image:\s*url\(&quot;(https:\/\/.*?)&quot;\)/g;
      const urls: string[] = [];
      let match;

      while ((match = urlPattern.exec(html)) !== null && urls.length < 4) {
        const url = match[1].replace(/&amp;/g, '&');
        if (url.includes('gotinder.com')) {
          urls.push(url);
        }
      }

      return urls;
    } catch (error) {
      console.error('Error getting images:', error);
      return [];
    }
  }

  async ensureTinderPage(): Promise<void> {
    try {
      await this.run('open https://tinder.com/app/recs');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Error opening Tinder:', error);
    }
  }
}
