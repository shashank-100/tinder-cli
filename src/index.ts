#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { PreferenceCollector } from './preferences.js';
import { AgentBrowserControl } from './agentBrowser.js';
import { ProfileAnalyzer } from './analyze.js';
import { AutoSwiper } from './autoSwiper.js';

const program = new Command();

program
  .name('tinder-agent')
  .description('AI-powered Tinder swiping agent')
  .version('1.0.0');

/**
 * Command: swipe-right
 * Swipe right on current profile
 */
program
  .command('swipe-right')
  .description('Swipe right (LIKE) on the current profile')
  .action(async () => {
    try {
      const browser = new AgentBrowserControl();
      console.log(chalk.cyan('👆 Swiping right...'));
      await browser.swipeRight();
      await browser.nextProfile();
      console.log(chalk.green('✅ Done!\n'));
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}\n`));
      process.exit(1);
    }
  });

/**
 * Command: swipe-left
 * Swipe left on current profile
 */
program
  .command('swipe-left')
  .description('Swipe left (NOPE) on the current profile')
  .action(async () => {
    try {
      const browser = new AgentBrowserControl();
      console.log(chalk.cyan('👆 Swiping left...'));
      await browser.swipeLeft();
      await browser.nextProfile();
      console.log(chalk.green('✅ Done!\n'));
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}\n`));
      process.exit(1);
    }
  });

/**
 * Command: analyze
 * Analyze current profile without swiping
 */
program
  .command('analyze')
  .description('Analyze the current profile without swiping')
  .action(async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('\n❌ Error: OPENAI_API_KEY not set\n'));
      process.exit(1);
    }

    try {
      const browser = new AgentBrowserControl();
      const analyzer = new ProfileAnalyzer(apiKey);

      console.log(chalk.cyan('🔍 Analyzing current profile...\n'));

      const pageText = await browser.getPageText();
      const imageUrls = await browser.getProfileImages();

      console.log(chalk.gray(`📸 Found ${imageUrls.length} images`));

      const result = await analyzer.analyze(pageText, imageUrls, {
        type: ['attractive'],
        ageRange: { min: 20, max: 35 },
        distance: 50,
        interests: []
      });

      console.log('\n' + '='.repeat(60));
      console.log(chalk.bold.cyan(`\n${result.name}, ${result.age}`));
      console.log(chalk.white(result.bio || '(no bio)'));

      const scoreColor = result.score >= 7 ? chalk.green : result.score >= 5 ? chalk.yellow : chalk.red;
      console.log('\n' + chalk.bold('Score: ') + scoreColor(`${result.score}/10`));
      console.log(chalk.gray(`Reasoning: ${result.reasoning}`));

      if (result.action === 'RIGHT') {
        console.log(chalk.green.bold('\n✓ Recommendation: Swipe Right ❤️'));
      } else {
        console.log(chalk.red.bold('\n✗ Recommendation: Swipe Left ❌'));
      }

      console.log('='.repeat(60) + '\n');

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}\n`));
      process.exit(1);
    }
  });

/**
 * Command: auto-swipe
 * Automated swiping with AI analysis
 */
program
  .command('auto-swipe')
  .description('Automatically swipe through profiles with AI analysis')
  .option('--limit <number>', 'Number of profiles to process', '20')
  .option('--min-score <number>', 'Minimum score to swipe right (1-10)', '7')
  .option('--auto', 'Auto mode (no delays)', false)
  .option('--skip-preferences', 'Skip preference collection', false)
  .action(async (options) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('\n❌ Error: OPENAI_API_KEY not set\n'));
      console.log(chalk.yellow('Set it with: export OPENAI_API_KEY=your-api-key\n'));
      process.exit(1);
    }

    try {
      // Collect preferences
      let preferences;
      if (options.skipPreferences) {
        preferences = {
          type: ['attractive', 'fun', 'interesting'],
          ageRange: { min: 20, max: 30 },
          distance: 50,
          interests: ['travel', 'fun', 'adventure']
        };
        console.log(chalk.gray('\nUsing default preferences...\n'));
      } else {
        const collector = new PreferenceCollector();
        preferences = await collector.collect();
      }

      // Create auto-swiper and run
      const swiper = new AutoSwiper(apiKey);

      await swiper.run(preferences, {
        limit: parseInt(options.limit),
        minScore: parseFloat(options.minScore),
        autoMode: options.auto
      });

      console.log(chalk.green('✨ Auto-swipe complete!\n'));

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}\n`));
      process.exit(1);
    }
  });

/**
 * Legacy command: start (keep for backwards compatibility)
 */
program
  .command('start')
  .description('[DEPRECATED] Use auto-swipe instead')
  .option('--limit <number>', 'Number of profiles to process', '20')
  .option('--skip-preferences', 'Skip preference collection', false)
  .action(async (options) => {
    console.log(chalk.yellow('⚠️  The "start" command is deprecated. Use "auto-swipe" instead.\n'));
    console.log(chalk.gray('Redirecting to auto-swipe...\n'));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('\n❌ Error: OPENAI_API_KEY not set\n'));
      process.exit(1);
    }

    try {
      let preferences;
      if (options.skipPreferences) {
        preferences = {
          type: ['attractive'],
          ageRange: { min: 20, max: 30 },
          distance: 50,
          interests: []
        };
      } else {
        const collector = new PreferenceCollector();
        preferences = await collector.collect();
      }

      const swiper = new AutoSwiper(apiKey);
      await swiper.run(preferences, {
        limit: parseInt(options.limit),
        autoMode: false
      });

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}\n`));
      process.exit(1);
    }
  });

program.parse();
