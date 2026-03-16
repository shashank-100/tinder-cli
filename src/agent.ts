import chalk from 'chalk';
import ora from 'ora';
import { UserPreferences, Profile, SwipeDecision } from './types.js';
import { ProfileScorer } from './scorer.js';

export class TinderAgent {
  public scorer: ProfileScorer;
  private preferences: UserPreferences | null = null;
  private swipeHistory: SwipeDecision[] = [];

  constructor(apiKey: string) {
    this.scorer = new ProfileScorer(apiKey);
  }

  setPreferences(preferences: UserPreferences) {
    this.preferences = preferences;
  }

  private displayProfile(profile: Profile) {
    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan(`\n${profile.name}, ${profile.age}`));
    console.log(chalk.gray(`${profile.distance}km away\n`));
    console.log(chalk.white(profile.bio));
    console.log(chalk.gray('\nInterests: ') + chalk.yellow(profile.interests.join(', ')));
  }

  private displayDecision(decision: SwipeDecision) {
    const scoreColor = decision.score >= 7 ? chalk.green : decision.score >= 5 ? chalk.yellow : chalk.red;

    console.log('\n' + chalk.bold('Score: ') + scoreColor(`${decision.score}/10`));

    if (decision.reasoning) {
      console.log(chalk.gray(`Reasoning: ${decision.reasoning}`));
    }

    if (decision.action === 'RIGHT') {
      console.log(chalk.green.bold('\n✓ Action: Swipe Right ❤️'));
    } else {
      console.log(chalk.red.bold('\n✗ Action: Swipe Left ❌'));
    }

    console.log('='.repeat(60));
  }

  async processProfile(
    profile: Profile,
    autoSwipe: boolean = false,
    imageUrls: string[] = []
  ): Promise<SwipeDecision> {
    if (!this.preferences) {
      throw new Error('Preferences not set. Call setPreferences() first.');
    }

    this.displayProfile(profile);

    const spinner = ora(chalk.cyan('Analyzing profile & images...')).start();

    const decision = await this.scorer.scoreProfile(profile, this.preferences, imageUrls);

    spinner.stop();

    this.displayDecision(decision);
    this.swipeHistory.push(decision);

    if (!autoSwipe) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    return decision;
  }

  async run(profiles: Profile[], autoSwipe: boolean = false) {
    if (!this.preferences) {
      throw new Error('Preferences not set. Call setPreferences() first.');
    }

    console.log(chalk.bold.magenta('\n🔥 Starting Tinder Agent...\n'));
    console.log(chalk.gray(`Processing ${profiles.length} profiles...\n`));

    for (const profile of profiles) {
      await this.processProfile(profile, autoSwipe);

      if (!autoSwipe) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    this.displaySummary();
  }

  private displaySummary() {
    const rightSwipes = this.swipeHistory.filter(d => d.action === 'RIGHT').length;
    const leftSwipes = this.swipeHistory.filter(d => d.action === 'LEFT').length;
    const avgScore = this.swipeHistory.reduce((sum, d) => sum + d.score, 0) / this.swipeHistory.length;

    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan('\n📊 Session Summary\n'));
    console.log(chalk.green(`❤️  Right swipes: ${rightSwipes}`));
    console.log(chalk.red(`❌ Left swipes: ${leftSwipes}`));
    console.log(chalk.yellow(`📈 Average score: ${avgScore.toFixed(1)}/10`));
    console.log(chalk.gray(`\nTotal profiles: ${this.swipeHistory.length}`));

    if (rightSwipes > 0) {
      console.log(chalk.bold.green('\n🎉 Top matches:'));
      this.swipeHistory
        .filter(d => d.action === 'RIGHT')
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .forEach((d, i) => {
          console.log(chalk.cyan(`  ${i + 1}. ${d.profile.name} (${d.score}/10)`));
        });
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  getSwipeHistory(): SwipeDecision[] {
    return this.swipeHistory;
  }
}
