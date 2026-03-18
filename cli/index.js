#!/usr/bin/env node

import { program } from 'commander'
import { chatCommand } from './commands/chat.js'
import { askCommand } from './commands/ask.js'
import { configCommand } from './commands/config.js'
import chalk from 'chalk'

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
  .option('-r, --run', 'generate and execute a terminal command')
  .action((question, options) => askCommand(question, options))

program
  .command('config')
  .description('Configure ATLAS settings')
  .action(configCommand)

program
  .command('help')
  .description('Display help for ATLAS')
  .action(() => {
    console.log(chalk.cyan('\n  ATLAS Terminal — AI assistant in your terminal'))
    console.log(chalk.cyan('  ─'.repeat(25)))

    console.log(chalk.cyan('\n  Commands:'))
    console.log(chalk.white('    atlas chat                ') + chalk.gray('Start a conversation with memory'))
    console.log(chalk.white('    atlas ask <question>      ') + chalk.gray('Ask a single question'))
    console.log(chalk.white('    atlas config              ') + chalk.gray('Set up your API keys'))
    console.log(chalk.white('    atlas help                ') + chalk.gray('Show this help message'))

    console.log(chalk.cyan('\n  Flags:'))
    console.log(chalk.white('    -f, --file <path>         ') + chalk.gray('Attach a file to your question'))
    console.log(chalk.white('    -p, --project <path>      ') + chalk.gray('Load an entire project into context'))
    console.log(chalk.white('    -s, --search              ') + chalk.gray('Search the web'))
    console.log(chalk.white('    -w, --write <path>        ') + chalk.gray('Write response to a file'))
    console.log(chalk.white('    -g, --git                 ') + chalk.gray('Include git context'))
    console.log(chalk.white('    -r, --run                 ') + chalk.gray('Generate and execute a terminal command'))

    console.log(chalk.cyan('\n  Examples:'))
    console.log(chalk.gray('    atlas ask "explain this" --file index.js'))
    console.log(chalk.gray('    atlas ask "fix this bug" --file index.js --write index.js'))
    console.log(chalk.gray('    atlas ask "latest node version" --search'))
    console.log(chalk.gray('    atlas ask "write a commit message" --git'))
    console.log(chalk.gray('    atlas ask "list running processes" --run'))
    console.log(chalk.gray('    atlas chat --project .'))
    console.log(chalk.gray('    atlas chat --git'))
    console.log(chalk.gray('    cat error.log | atlas ask "what is wrong here?"'))

    console.log(chalk.cyan('\n  Mid-conversation flags:'))
    console.log(chalk.gray('    You: explain this --file index.js'))
    console.log(chalk.gray('    You: search for latest React --search'))
    console.log(chalk.gray('    You: create a server --write server.js'))
    console.log(chalk.gray('    You: what changed recently --git'))
    console.log(chalk.gray('    You: show running processes RUN'))

    console.log(chalk.cyan('\n  More info: github.com/PSGtatitos/rubber-duck-cli\n'))
  })

program.parse()