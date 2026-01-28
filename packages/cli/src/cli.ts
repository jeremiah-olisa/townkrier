#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createMakeNotificationCommand } from './commands/make-notification.command';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

/**
 * TownKrier CLI
 * Laravel-style commands for generating notification classes
 */
const program = new Command();

program
  .name('townkrier')
  .description('TownKrier CLI - Laravel-style notification system for Node.js')
  .version(packageJson.version, '-v, --version')
  .addHelpText(
    'after',
    `
${chalk.blue('Examples:')}
  ${chalk.gray('# Generate a notification with interactive prompts')}
  $ townkrier make:notification WelcomeUser

  ${chalk.gray('# Generate a notification with email and SMS channels')}
  $ townkrier make:notification OrderConfirmation --channels email,sms

  ${chalk.gray('# Generate a notification with all channels')}
  $ townkrier make:notification ImportantAlert --channels email,sms,push,in-app

  ${chalk.gray('# Generate a notification in a custom path')}
  $ townkrier make:notification UserInvite --path ./src/app/notifications

  ${chalk.gray('# Force overwrite existing notification')}
  $ townkrier make:notification Welcome --force

${chalk.blue('Available Channels:')}
  ${chalk.gray('- email     Email notifications')}
  ${chalk.gray('- sms       SMS notifications')}
  ${chalk.gray('- push      Push notifications')}
  ${chalk.gray('- in-app    In-app/Database notifications')}

${chalk.blue('Documentation:')}
  ${chalk.gray('https://github.com/jeremiah-olisa/townkrier')}
    `,
  );

// Register commands
program.addCommand(createMakeNotificationCommand());

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
