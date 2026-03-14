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
  .option('-s, --search', 'search the web to answer your question')
  .option('-w, --write <path>', 'write response to a file')
  .option('-g, --git', 'include git context in your question')
  .action((options) => chatCommand(options))

program
  .command('ask <question>')
  .description('Ask ATLAS a single question')
  .option('-f, --file <path>', 'attach a file to your question')
  .option('-p, --project <path>', 'attach a project directory to your question')
  .option('-s, --search', 'search the web to answer your question')
  .option('-w, --write <path>', 'write response to a file')
  .option('-g, --git', 'include git context in your question')
  .action((question, options) => askCommand(question, options))

program
  .command('config')
  .description('Configure ATLAS settings')
  .action(configCommand)

program
  .command('help')
  .description('Display help for Atlas')
  .action(() => {
    console.log(chalk.cyan('ATLAS Help'))
    console.log(chalk.cyan('---------------'))
    console.log(chalk.gray('ATLAS is a helpful AI developer assistant that lives in your terminal.'))
    console.log(chalk.gray('It can answer questions about your code, help with debugging, and more.'))

    console.log(chalk.cyan('\nCommands:'))
    console.log(chalk.cyan('  atlas chat       Start a conversation with ATLAS'))
    console.log(chalk.cyan('  atlas ask <question>  Ask ATLAS a single question'))
    console.log(chalk.cyan('  atlas config      Configure ATLAS settings'))
    console.log(chalk.cyan('  atlas help        Display this help message'))

    console.log(chalk.cyan('\nOptions:'))
    console.log(chalk.cyan('  --file <path>     Attach a file to your question or conversation'))
    console.log(chalk.cyan('  --project <path>  Attach a project directory to your question or conversation'))
    console.log(chalk.cyan('  --search          Search the web to answer your question'))
    console.log(chalk.cyan('  --write <path>    Write the response to a file'))
    console.log(chalk.cyan('  --git            Include git context in your question'))
  })
program.parse()