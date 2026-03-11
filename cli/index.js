#!/usr/bin/env node

import { program } from 'commander'
import { chatCommand } from './commands/chat.js'
import { askCommand } from './commands/ask.js'
import { configCommand } from './commands/config.js'

program
  .name('atlas')
  .description('AI assistant that lives in your terminal')
  .version('1.0.0')

program
  .command('chat')
  .description('Start a conversation with ATLAS')
  .option('-f, --file <path>', 'attach a file to start the conversation')
  .option('-p, --project <path>', 'attach a project directory to start the conversation')
  .action((options) => chatCommand(options))

program
  .command('ask <question>')
  .description('Ask ATLAS a single question')
  .option('-f, --file <path>', 'attach a file to your question')
  .option('-p, --project <path>', 'attach a project directory to your question')
  .action((question, options) => askCommand(question, options))

program
  .command('config')
  .description('Configure ATLAS settings')
  .action(configCommand)

program.parse()