import { spawn } from 'child_process'
import chalk from 'chalk'
import readline from 'readline'

const BLOCKED = [
  /rm\s+-rf\s*\//,
  /mkfs/,
  /dd\s+if=/,
  /:\s*\{\s*:\s*\|\s*:\s*&\s*;\s*\}/,
  />\s*\/dev\/sda/,
  /chmod\s+-R\s+777\s*\//,
]

function confirmRun(command) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(
      chalk.yellow(`\nI want to run: `) + chalk.white(command) + chalk.yellow('\nConfirm? (y/n): '),
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y')
      }
    )
  })
}

export async function runCommand(command) {
  if (BLOCKED.some(pattern => pattern.test(command))) {
    console.log(chalk.red('\nBlocked: That command is not allowed.\n'))
    return null
  }

  const confirmed = await confirmRun(command)
  if (!confirmed) {
    console.log(chalk.yellow('\nRun cancelled.\n'))
    return null
  }

  return new Promise((resolve) => {
    const child = spawn(command, [], { shell: true })
    let fullOutput = ''

    console.log(chalk.gray('\n--- output ---'))

    child.stdout.on('data', (data) => {
      const text = data.toString()
      process.stdout.write(text)
      fullOutput += text
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      process.stderr.write(chalk.red(text))
      fullOutput += text
    })

    child.on('close', (code) => {
      console.log(chalk.gray(`--- exit code ${code} ---\n`))
      resolve(fullOutput)
    })
  })
}

export function extractCommand(response) {
  const backtick = response.match(/`([^`]+)`/)
  if (backtick) return backtick[1]

  const codeBlock = response.match(/```(?:bash|sh)?\n?([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()

  const lines = response.trim().split('\n')
  return lines[lines.length - 1].trim()
}