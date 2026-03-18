#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { AgentBrowserControl } from './agentBrowser.js';
import { ProfileAnalyzer } from './analyze.js';

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

      const result = await analyzer.analyze(pageText, imageUrls);

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
  .action(async (options) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('\n❌ Error: OPENAI_API_KEY not set\n'));
      console.log(chalk.yellow('Set it with: export OPENAI_API_KEY=your-api-key\n'));
      process.exit(1);
    }

    const browser = new AgentBrowserControl();
    const analyzer = new ProfileAnalyzer(apiKey);
    const limit = parseInt(options.limit);
    const minScore = parseFloat(options.minScore);
    const seenProfiles = new Set<string>();
    let rightSwipes = 0;
    let leftSwipes = 0;

    console.log(chalk.cyan('🌐 Opening Tinder...\n'));
    await browser.openTinder();
    console.log(chalk.magenta(`🔥 Auto-swipe started (limit: ${limit}, min score: ${minScore})\n`));

    for (let i = 0; i < limit; i++) {
      console.log(chalk.gray(`\n[${i + 1}/${limit}] Waiting for profile...`));

      // Wait for profile to load
      let loaded = false;
      for (let w = 0; w < 15000; w += 2000) {
        if (await browser.isProfileLoaded()) { loaded = true; break; }
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!loaded) { console.log(chalk.yellow('\n⚠️  No more profiles\n')); break; }

      // Get profile data (same as analyze command)
      const pageText = await browser.getPageText();
      const imageUrls = await browser.getProfileImages();
      console.log(chalk.gray(`📸 Found ${imageUrls.length} images`));

      // Analyze with Vision API
      const result = await analyzer.analyze(pageText, imageUrls);

      // Skip duplicates
      const key = `${result.name}-${result.age}`;
      if (seenProfiles.has(key)) {
        console.log(chalk.yellow(`⚠️  Duplicate ${key}, skipping`));
        await browser.nextProfile(2000);
        continue;
      }
      seenProfiles.add(key);

      // Display result
      console.log('\n' + '='.repeat(60));
      console.log(chalk.bold.cyan(`\n${result.name}, ${result.age}`));
      console.log(chalk.white(result.bio || '(no bio)'));
      const scoreColor = result.score >= 7 ? chalk.green : result.score >= 5 ? chalk.yellow : chalk.red;
      console.log('\n' + chalk.bold('Score: ') + scoreColor(`${result.score}/10`));
      console.log(chalk.gray(`Reasoning: ${result.reasoning}`));

      // Apply min-score override
      const action = result.score >= minScore ? 'RIGHT' : 'LEFT';

      if (action === 'RIGHT') {
        console.log(chalk.green.bold('\n✓ Swipe Right ❤️'));
        await browser.swipeRight();
        rightSwipes++;
      } else {
        console.log(chalk.red.bold('\n✗ Swipe Left ❌'));
        await browser.swipeLeft();
        leftSwipes++;
      }
      console.log('='.repeat(60));

      await browser.nextProfile(3000);
    }

    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan('\n📊 Summary\n'));
    console.log(chalk.green(`❤️  Right: ${rightSwipes}`));
    console.log(chalk.red(`❌ Left: ${leftSwipes}`));
    console.log('='.repeat(60) + '\n');
  });

program.parse();
