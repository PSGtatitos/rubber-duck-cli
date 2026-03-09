import inquirer from 'inquirer'
import chalk from 'chalk'
import Conf from 'conf'
import Groq from 'groq-sdk'

const config = new Conf({ projectName: 'atlas-cli' })

export async function configCommand() {
  console.log(chalk.cyan('\nWelcome to ATLAS setup!\n'))

  const existing = config.get('groqApiKey')
  if (existing) {
    console.log(chalk.gray(`Current API key: ${existing.slice(0, 8)}...\n`))
  }

  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'groqApiKey',
      message: 'Enter your Groq API key (get one at console.groq.com):',
      mask: '*',
      validate: (val) => val.length > 0 ? true : 'API key cannot be empty'
    }
  ])

  // Validate the key by making a test call
  console.log(chalk.gray('\nValidating API key...'))

  try {
    const groq = new Groq({ apiKey: answers.groqApiKey })
    await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 1
    })

    config.set('groqApiKey', answers.groqApiKey)

    console.log(chalk.green('\n✓ API key valid'))
    console.log(chalk.green('✓ ATLAS is ready'))
    console.log(chalk.cyan('\nRun atlas chat to start.\n'))

  } catch (error) {
    console.log(chalk.red('\n✗ Invalid API key. Please check and try again.\n'))
    process.exit(1)
  }
}
