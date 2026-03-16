import { exec } from 'child_process';
import { promisify } from 'util';
import { Profile } from './types.js';
import inquirer from 'inquirer';

const execAsync = promisify(exec);

export class TinderBrowser {
  private browsePath = `${process.env.HOME}/.claude/skills/gstack/browse/dist/browse`;

  private async runBrowse(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`${this.browsePath} ${command}`);
      if (stderr && !stderr.includes('[browse]')) {
        console.error('Browse stderr:', stderr);
      }
      return stdout;
    } catch (error) {
      throw new Error(`Browse command failed: ${error}`);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const url = await this.runBrowse('url');
      // If we're on /app/recs or similar, we're logged in
      return url.includes('/app/');
    } catch {
      return false;
    }
  }

  async login(): Promise<boolean> {
    console.log('🌐 Connecting to Tinder session...\n');

    // Navigate to Tinder app (will use existing session if logged in)
    await this.runBrowse('goto https://tinder.com/app/recs');

    // Check if already logged in
    const loggedIn = await this.isLoggedIn();
    if (loggedIn) {
      console.log('✅ Already logged in! Using existing session.\n');
      return true;
    }

    // Not logged in - user needs to login manually
    console.log('🔐 Not logged in to Tinder.');
    console.log('   Please login using your browser, then run this command again.\n');
    console.log('   Quick login:');
    console.log('   1. Open https://tinder.com in your browser');
    console.log('   2. Log in normally');
    console.log('   3. The session will persist and this tool will use it!\n');

    await this.close();
    process.exit(0);
  }

  async getCurrentProfile(): Promise<Profile | null> {
    try {
      // Get page text and structure
      const pageText = await this.runBrowse('text');

      // Extract profile info using JavaScript
      const profileData = await this.runBrowse(`js "(() => {
        const nameEl = document.querySelector('[itemprop=\"name\"]');
        const ageEl = document.querySelector('[itemprop=\"age\"]');
        const bioEl = document.querySelector('[itemprop=\"description\"]') || document.querySelector('.Bdrs\\\\(8px\\\\)');

        return JSON.stringify({
          name: nameEl?.textContent || 'Unknown',
          age: ageEl?.textContent || '0',
          bio: bioEl?.textContent || '',
          distance: '0'
        });
      })()"`);

      const data = JSON.parse(profileData.trim());

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
    // Simple keyword extraction - could be improved with NLP
    const keywords = ['AI', 'tech', 'startup', 'travel', 'fitness', 'yoga', 'music', 'art', 'food', 'coffee'];
    return keywords.filter(k => bio.toLowerCase().includes(k.toLowerCase()));
  }

  async swipeRight(): Promise<void> {
    // Tinder uses aria-label="Like" for the heart button
    try {
      const snapshot = await this.runBrowse('snapshot -i');
      // Look for Like button
      const likeMatch = snapshot.match(/@e(\d+).*Like/i);
      if (likeMatch) {
        await this.runBrowse(`click @e${likeMatch[1]}`);
      } else {
        // Fallback: try keyboard shortcut
        await this.runBrowse('press ArrowRight');
      }
    } catch (error) {
      console.error('Error swiping right:', error);
    }
  }

  async swipeLeft(): Promise<void> {
    // Tinder uses aria-label="Nope" for the X button
    try {
      const snapshot = await this.runBrowse('snapshot -i');
      // Look for Nope button
      const nopeMatch = snapshot.match(/@e(\d+).*Nope/i);
      if (nopeMatch) {
        await this.runBrowse(`click @e${nopeMatch[1]}`);
      } else {
        // Fallback: try keyboard shortcut
        await this.runBrowse('press ArrowLeft');
      }
    } catch (error) {
      console.error('Error swiping left:', error);
    }
  }

  async close(): Promise<void> {
    await this.runBrowse('stop');
  }
}
