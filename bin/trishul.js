#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../src/commands/init.js';
import { forgeCommand } from '../src/commands/forge.js';
import { invokeCommand } from '../src/commands/invoke.js';
import { syncCommand } from '../src/commands/sync.js';

const program = new Command();

program
  .name('trishul')
  .description('🔱 Trishul — Contract-first backend & frontend scaffolding CLI\n\n   Define intent. Forge structure. Write only what matters.')
  .version('1.0.0');

program
  .command('init')
  .description('⚒️  Initialize a new Trishul project with interactive prompts')
  .action(initCommand);

program
  .command('forge')
  .description('🔥 Forge backend structure from trishul.schema.js blueprint')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .action(forgeCommand);

program
  .command('invoke <clientFile>')
  .description('⚡ Generate frontend API layer from trishul.client.js')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .action(invokeCommand);

program
  .command('sync')
  .description('🔄 Diff backend schema vs frontend client and generate sync report')
  .action(syncCommand);

program.parse(process.argv);
