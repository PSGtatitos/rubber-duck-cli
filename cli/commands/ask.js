import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs'
import path from 'path'
import { askGroq } from '../utils/groq.js'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-cli' })

export async function askCommand(question, options) {
  if (!config.get('groqApiKey')) {
    console.log(chalk.red('No API key found. Run atlas config first.'))
    process.exit(1)
  }

  let fullQuestion = question

  // Handle piped input
  if (!fullQuestion) {
    const chunks = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    fullQuestion = Buffer.concat(chunks).toString().trim()
  }

  if (!fullQuestion) {
    console.log(chalk.red('No question provided.'))
    process.exit(1)
  }

  // Handle --file flag
  if (options.file) {
    const filePath = path.resolve(options.file)

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`File not found: ${filePath}`))
      process.exit(1)
    }

    const stats = fs.statSync(filePath)
    if (stats.size > 50000) {
      console.log(chalk.red('File too large. Maximum size is 50kb.'))
      process.exit(1)
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const fileName = path.basename(filePath)

    fullQuestion = `${fullQuestion}\n\nHere is the file "${fileName}":\n\`\`\`\n${fileContent}\n\`\`\``
  }

  const spinner = ora('Thinking...').start()

  try {
    spinner.stop()
    process.stdout.write(chalk.blue('ATLAS: '))

    const stream = await askGroq(fullQuestion, [])

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || ''
      process.stdout.write(token)
    }

    console.log('\n')

  } catch (error) {
    spinner.stop()
    if (error.message?.includes('API key')) {
      console.log(chalk.red('Invalid API key. Run atlas config to update it.'))
    } else {
      console.log(chalk.red(`Error: ${error.message}`))
    }
    process.exit(1)
  }
}