#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { PreferenceCollector } from './preferences.js';
import { TinderAgent } from './agent.js';
import { AgentBrowserControl } from './agentBrowser.js';
import { CSVExporter } from './csvExporter.js';

const program = new Command();

program
  .name('tinder-agent')
  .description('AI-powered Tinder swiping agent using Claude')
  .version('1.0.0');

program
  .command('start')
  .description('Start the Tinder agent with real browser automation')
  .option('-a, --auto', 'Auto-swipe without delays', false)
  .option('--skip-preferences', 'Skip preference collection (use defaults)', false)
  .option('--limit <number>', 'Limit number of profiles to process', '20')
  .action(async (options) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error(chalk.red('\n❌ Error: OPENAI_API_KEY environment variable not set\n'));
      console.log(chalk.yellow('Set it with: export OPENAI_API_KEY=your-api-key\n'));
      process.exit(1);
    }

    try {
      const agent = new TinderAgent(apiKey);

      // Collect preferences
      let preferences;
      if (options.skipPreferences) {
        preferences = {
          type: ['attractive', 'fun', 'interesting'],
          ageRange: { min: 20, max: 30 },
          distance: 50,
          interests: ['travel', 'fun', 'adventure']
        };
        console.log(chalk.gray('\nUsing default preferences (prioritizing attractiveness)...\n'));
      } else {
        const collector = new PreferenceCollector();
        preferences = await collector.collect();
      }

      agent.setPreferences(preferences);

      // Real Tinder automation using agent-browser
      const browser = new AgentBrowserControl();
      const csvExporter = new CSVExporter();

      console.log(chalk.cyan('🌐 Connecting to Chrome with remote debugging...\n'));
      console.log(chalk.gray('Make sure Chrome is running with: --remote-debugging-port=9222\n'));

      // Ensure Tinder page is loaded
      await browser.ensureTinderPage();

      console.log(chalk.green('✅ Connected to Tinder!\n'));

      // Process profiles
      const limit = parseInt(options.limit);
      console.log(chalk.magenta(`🔥 Starting Tinder Agent (processing up to ${limit} profiles)...\n`));

      const seenProfiles = new Set<string>();

      for (let i = 0; i < limit; i++) {
        // Get raw page text and images
        const pageText = await browser.getPageText();
        const imageUrls = await browser.getProfileImages();

        if (!pageText || pageText.length < 100) {
          console.log(chalk.yellow('\n⚠️  No profile data found\n'));
          break;
        }

        console.log(chalk.gray(`📸 Found ${imageUrls.length} images`));

        // Download images locally first, then send local paths to OpenAI
        let localImagePaths: string[] = [];
        if (imageUrls.length > 0) {
          console.log(chalk.gray(`⬇️  Downloading images...`));
          localImagePaths = await csvExporter.downloadImages(imageUrls, 'temp', 0);
          console.log(chalk.gray(`✅ Downloaded ${localImagePaths.length} images\n`));
        }

        // Let LLM extract everything and decide (using local image paths)
        const decision = await agent.scorer.analyzeAndScore(pageText, localImagePaths, preferences);

        // Check for duplicates
        const profileKey = `${decision.extractedProfile.name}-${decision.extractedProfile.age}`;
        if (seenProfiles.has(profileKey)) {
          console.log(chalk.yellow(`\n⚠️  Duplicate profile detected: ${profileKey}, skipping...\n`));
          continue;
        }
        seenProfiles.add(profileKey);

        // Save to CSV with already-downloaded image paths
        await csvExporter.saveProfile(decision, localImagePaths);

        // Display profile
        console.log('\n' + '='.repeat(60));
        console.log(chalk.bold.cyan(`\n${decision.extractedProfile.name}, ${decision.extractedProfile.age}`));
        console.log(chalk.white(decision.extractedProfile.bio));

        const scoreColor = decision.score >= 7 ? chalk.green : decision.score >= 5 ? chalk.yellow : chalk.red;
        console.log('\n' + chalk.bold('Score: ') + scoreColor(`${decision.score}/10`));
        console.log(chalk.gray(`Reasoning: ${decision.reasoning}`));

        if (decision.action === 'RIGHT') {
          console.log(chalk.green.bold('\n✓ Action: Swipe Right ❤️'));
          await browser.swipeRight();
        } else {
          console.log(chalk.red.bold('\n✗ Action: Swipe Left ❌'));
          await browser.swipeLeft();
        }

        console.log('='.repeat(60));

        if (!options.auto) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(chalk.cyan('\n🎉 Done! Check Chrome to see the results.\n'));
      console.log(chalk.green(`✨ Agent session complete!\n`));
      console.log(chalk.blue(`📊 Results saved to: ${csvExporter.getFilePath()}\n`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      }
      process.exit(1);
    }
  });


program.parse();
