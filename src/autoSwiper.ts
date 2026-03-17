import chalk from 'chalk';
import { AgentBrowserControl } from './agentBrowser.js';
import { ProfileAnalyzer, AnalysisResult } from './analyze.js';
import { UserPreferences } from './types.js';
import { CSVExporter } from './csvExporter.js';

/**
 * AUTO-SWIPE AGENT
 * Orchestrates the swiping loop using browser tools + LLM analyzer
 */

export interface AutoSwipeOptions {
  limit: number;
  minScore?: number;
  autoMode?: boolean;
}

export class AutoSwiper {
  private browser: AgentBrowserControl;
  private analyzer: ProfileAnalyzer;
  private csvExporter: CSVExporter;
  private seenProfiles: Set<string>;

  constructor(apiKey: string) {
    this.browser = new AgentBrowserControl();
    this.analyzer = new ProfileAnalyzer(apiKey);
    this.csvExporter = new CSVExporter();
    this.seenProfiles = new Set();
  }

  /**
   * Main auto-swipe loop
   */
  async run(preferences: UserPreferences, options: AutoSwipeOptions): Promise<void> {
    console.log(chalk.cyan('🌐 Connecting to Tinder...\n'));

    // Ensure Tinder is open
    await this.browser.openTinder();
    console.log(chalk.green('✅ Connected!\n'));

    console.log(chalk.magenta(`🔥 Starting auto-swipe (limit: ${options.limit})...\n`));

    let rightSwipes = 0;
    let leftSwipes = 0;

    for (let i = 0; i < options.limit; i++) {
      try {
        // Wait for profile to load
        const loaded = await this.waitForProfile();
        if (!loaded) {
          console.log(chalk.yellow('\n⚠️  No more profiles available\n'));
          break;
        }

        // Get profile data
        const pageText = await this.browser.getPageText();
        const imageUrls = await this.browser.getProfileImages();

        if (!pageText || pageText.length < 100) {
          console.log(chalk.yellow('\n⚠️  Empty profile data\n'));
          break;
        }

        console.log(chalk.gray(`📸 Found ${imageUrls.length} images`));

        // Download images
        const quickName = await this.extractQuickName(pageText);
        const localImagePaths = await this.csvExporter.downloadImages(
          imageUrls,
          quickName.name,
          quickName.age
        );

        // Analyze profile
        const result = await this.analyzer.analyze(pageText, localImagePaths, preferences);

        // Check for duplicates
        const profileKey = `${result.name}-${result.age}`;
        if (this.seenProfiles.has(profileKey)) {
          console.log(chalk.yellow(`\n⚠️  Duplicate: ${profileKey} - skipping\n`));
          continue;
        }
        this.seenProfiles.add(profileKey);

        // Display profile
        this.displayProfile(result);

        // Check min score filter
        if (options.minScore && result.score < options.minScore) {
          console.log(chalk.gray(`Score ${result.score} < min ${options.minScore} → forcing LEFT\n`));
          result.action = 'LEFT';
        }

        // Execute swipe
        if (result.action === 'RIGHT') {
          await this.browser.swipeRight();
          rightSwipes++;
        } else {
          await this.browser.swipeLeft();
          leftSwipes++;
        }

        // Save to CSV
        await this.csvExporter.saveProfile(
          {
            profile: {
              id: Date.now().toString(),
              name: result.name,
              age: result.age,
              bio: result.bio,
              distance: 0,
              interests: []
            },
            score: result.score,
            action: result.action,
            reasoning: result.reasoning
          },
          localImagePaths
        );

        // Wait before next
        await this.browser.nextProfile(options.autoMode ? 2000 : 3000);

      } catch (error) {
        console.error(chalk.red(`\n❌ Error: ${error}\n`));
        continue;
      }
    }

    // Summary
    this.displaySummary(rightSwipes, leftSwipes);
  }

  /**
   * Wait for profile to load (with timeout)
   */
  private async waitForProfile(maxWait: number = 15000): Promise<boolean> {
    const checkInterval = 2000;
    let waited = 0;

    while (waited < maxWait) {
      const loaded = await this.browser.isProfileLoaded();
      if (loaded) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    return false;
  }

  /**
   * Quick name extraction for image filenames
   */
  private async extractQuickName(pageText: string): Promise<{ name: string; age: number }> {
    // Simple regex extraction (fast, no API call)
    const nameMatch = pageText.match(/^([A-Z][a-z]+),?\s*(\d{2})/m);
    if (nameMatch) {
      return {
        name: nameMatch[1],
        age: parseInt(nameMatch[2])
      };
    }
    return { name: 'unknown', age: 0 };
  }

  /**
   * Display profile
   */
  private displayProfile(result: AnalysisResult): void {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan(`\n${result.name}, ${result.age}`));
    console.log(chalk.white(result.bio));

    const scoreColor = result.score >= 7 ? chalk.green : result.score >= 5 ? chalk.yellow : chalk.red;
    console.log('\n' + chalk.bold('Score: ') + scoreColor(`${result.score}/10`));
    console.log(chalk.gray(`Reasoning: ${result.reasoning}`));

    if (result.action === 'RIGHT') {
      console.log(chalk.green.bold('\n✓ Action: Swipe Right ❤️'));
    } else {
      console.log(chalk.red.bold('\n✗ Action: Swipe Left ❌'));
    }

    console.log('='.repeat(60));
  }

  /**
   * Display summary
   */
  private displaySummary(rightSwipes: number, leftSwipes: number): void {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan('\n📊 Session Summary\n'));
    console.log(chalk.green(`❤️  Right swipes: ${rightSwipes}`));
    console.log(chalk.red(`❌ Left swipes: ${leftSwipes}`));
    console.log(chalk.gray(`\nTotal profiles: ${rightSwipes + leftSwipes}`));
    console.log(chalk.blue(`\n📊 Results saved to: ${this.csvExporter.getFilePath()}\n`));
    console.log('='.repeat(60) + '\n');
  }
}
