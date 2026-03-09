import chalk from 'chalk'
import ora from 'ora'
import { askGroq } from '../utils/groq.js'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-cli' })

export async function askCommand(question) {
  // Check config exists
  if (!config.get('groqApiKey')) {
    console.log(chalk.red('No API key found. Run atlas config first.'))
    process.exit(1)
  }

  // Handle piped input
  if (!question) {
    const chunks = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    question = Buffer.concat(chunks).toString().trim()
  }

  if (!question) {
    console.log(chalk.red('No question provided.'))
    process.exit(1)
  }

  const spinner = ora('Thinking...').start()

  try {
    spinner.stop()
    process.stdout.write(chalk.blue('ATLAS: '))

    const stream = await askGroq(question, [])

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
