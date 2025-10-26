import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as path from 'path';
import {
  generateNotificationTemplate,
  NotificationTemplateOptions,
} from '../templates/notification.template';
import {
  ensureDirectory,
  fileExists,
  getNotificationsDir,
  toPascalCase,
  writeFile,
} from '../utils/file.utils';

interface MakeNotificationOptions {
  channels?: string;
  path?: string;
  force?: boolean;
}

/**
 * Create the make:notification command
 */
export function createMakeNotificationCommand(): Command {
  const command = new Command('make:notification');

  command
    .description('Generate a new notification class')
    .argument('<name>', 'Name of the notification (e.g., WelcomeUser, OrderConfirmation)')
    .option('-c, --channels <channels>', 'Comma-separated list of channels (email,sms,push,in-app)')
    .option('-p, --path <path>', 'Custom path for the notification file')
    .option('-f, --force', 'Overwrite existing notification file')
    .action(async (name: string, options: MakeNotificationOptions) => {
      await makeNotification(name, options);
    });

  return command;
}

/**
 * Make notification command handler
 */
async function makeNotification(name: string, options: MakeNotificationOptions): Promise<void> {
  try {
    console.log(chalk.blue('\n🔔 Creating notification...\n'));

    // Clean and format the notification name
    const notificationName = name.replace(/Notification$/i, '');
    const className = toPascalCase(notificationName);
    const fileName = `${className}.notification.ts`;

    // Determine channels to include
    let selectedChannels: string[] = [];

    if (options.channels) {
      // Parse channels from command line option
      const channelNames = options.channels
        .toLowerCase()
        .split(',')
        .map((c) => c.trim());
      selectedChannels = channelNames
        .map((ch) => {
          switch (ch) {
            case 'email':
              return 'NotificationChannel.EMAIL';
            case 'sms':
              return 'NotificationChannel.SMS';
            case 'push':
              return 'NotificationChannel.PUSH';
            case 'in-app':
            case 'inapp':
              return 'NotificationChannel.IN_APP';
            default:
              console.log(chalk.yellow(`⚠️  Unknown channel: ${ch}, skipping...`));
              return null;
          }
        })
        .filter(Boolean) as string[];
    } else {
      // Interactive channel selection
      const availableChannels = [
        { name: 'Email', value: 'NotificationChannel.EMAIL', checked: true },
        { name: 'SMS', value: 'NotificationChannel.SMS', checked: false },
        { name: 'Push', value: 'NotificationChannel.PUSH', checked: false },
        { name: 'In-App', value: 'NotificationChannel.IN_APP', checked: false },
      ];

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'channels',
          message: 'Select notification channels:',
          choices: availableChannels,
          validate: (input) => {
            if (input.length === 0) {
              return 'You must select at least one channel';
            }
            return true;
          },
        },
      ]);

      selectedChannels = answers.channels;
    }

    // Determine output path
    let outputPath: string;
    if (options.path) {
      outputPath = path.resolve(options.path);
    } else {
      outputPath = getNotificationsDir();
    }

    await ensureDirectory(outputPath);

    const filePath = path.join(outputPath, fileName);

    // Check if file already exists
    if ((await fileExists(filePath)) && !options.force) {
      const overwrite = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `File ${fileName} already exists. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite.overwrite) {
        console.log(chalk.yellow('\n❌ Operation cancelled.\n'));
        return;
      }
    }

    // Generate notification template
    const templateOptions: NotificationTemplateOptions = {
      name: className,
      channels: selectedChannels,
    };

    const content = generateNotificationTemplate(templateOptions);

    // Write file
    await writeFile(filePath, content);

    // Success message
    console.log(chalk.green(`✅ Notification created successfully!\n`));
    console.log(chalk.gray(`   File: ${filePath}`));
    console.log(chalk.gray(`   Class: ${className}Notification`));
    console.log(
      chalk.gray(
        `   Channels: ${selectedChannels.map((ch) => ch.replace('NotificationChannel.', '')).join(', ')}`,
      ),
    );
    console.log(chalk.blue('\n📝 Next steps:'));
    console.log(chalk.gray('   1. Implement the notification methods'));
    console.log(chalk.gray('   2. Import and use in your application\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error creating notification:'), error);
    process.exit(1);
  }
}
