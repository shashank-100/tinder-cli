import inquirer from 'inquirer';
import { UserPreferences } from './types.js';

export class PreferenceCollector {
  async collect(): Promise<UserPreferences> {
    console.log('\n🤖 Let\'s set up your preferences!\n');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'type',
        message: 'What type of people do you prefer? (comma-separated)',
        default: 'athletic, tech, creative',
        filter: (input: string) => input.split(',').map(s => s.trim())
      },
      {
        type: 'input',
        name: 'ageMin',
        message: 'Minimum age?',
        default: '23',
        validate: (input: string) => {
          const num = parseInt(input);
          return !isNaN(num) && num >= 18 || 'Please enter a valid age (18+)';
        },
        filter: (input: string) => parseInt(input)
      },
      {
        type: 'input',
        name: 'ageMax',
        message: 'Maximum age?',
        default: '30',
        validate: (input: string) => {
          const num = parseInt(input);
          return !isNaN(num) && num >= 18 || 'Please enter a valid age (18+)';
        },
        filter: (input: string) => parseInt(input)
      },
      {
        type: 'input',
        name: 'distance',
        message: 'Maximum distance (km)?',
        default: '20',
        validate: (input: string) => {
          const num = parseInt(input);
          return !isNaN(num) && num > 0 || 'Please enter a valid distance';
        },
        filter: (input: string) => parseInt(input)
      },
      {
        type: 'input',
        name: 'interests',
        message: 'What interests are you looking for? (comma-separated)',
        default: 'startup, AI, travel',
        filter: (input: string) => input.split(',').map(s => s.trim())
      }
    ]);

    const preferences: UserPreferences = {
      type: answers.type,
      ageRange: {
        min: answers.ageMin,
        max: answers.ageMax
      },
      distance: answers.distance,
      interests: answers.interests
    };

    console.log('\n✅ Preferences saved!\n');
    return preferences;
  }
}
