import readline from 'readline'
import chalk from 'chalk'
import { askGroq } from '../utils/groq.js'
import { handleSystemCommand } from '../utils/system.js'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-cli' })

const STOP_PHRASES = [
  'goodbye atlas',
  'goodbye',
  'exit',
  'quit',
  'ok that is all for today',
  "that's all for today",
  "ok that's all"
]

const NOISE_WORDS = new Set([
  '', 'huh', 'uh', 'um', 'hmm',
  'ah', 'oh', 'eh', 'a', 'the', 'i', 'it'
])

const MIN_INPUT_LENGTH = 2

export async function chatCommand() {
  // Check config exists
  if (!config.get('groqApiKey')) {
    console.log(chalk.red('No API key found. Run atlas config first.'))
    process.exit(1)
  }

  const conversationHistory = []

  console.log(chalk.cyan('─'.repeat(50)))
  console.log(chalk.cyan('  ATLAS — type your message, or "exit" to quit'))
  console.log(chalk.cyan('─'.repeat(50)) + '\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const askQuestion = () => {
    rl.question(chalk.green('You: '), async (input) => {
      const userInput = input.trim()

      // Empty input
      if (!userInput) {
        return askQuestion()
      }

      // Stop phrases
      if (STOP_PHRASES.some(p => userInput.toLowerCase().includes(p))) {
        console.log(chalk.cyan('\nATLAS: Goodbye!\n'))
        rl.close()
        return
      }

      // Noise/short input
      if (
        userInput.length < MIN_INPUT_LENGTH ||
        NOISE_WORDS.has(userInput.toLowerCase())
      ) {
        console.log(chalk.gray('[Skipped] Input too short.\n'))
        return askQuestion()
      }

      // System command check
      const systemResponse = handleSystemCommand(userInput)
      if (systemResponse) {
        console.log(chalk.yellow(`System: ${systemResponse}\n`))
        return askQuestion()
      }

      // Ask Groq
      try {
        process.stdout.write(chalk.blue('ATLAS: '))

        const stream = await askGroq(userInput, conversationHistory)

        let fullResponse = ''

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || ''
          process.stdout.write(token)
          fullResponse += token
        }

        console.log('\n')

        // Update conversation history
        conversationHistory.push({ role: 'user', content: userInput })
        conversationHistory.push({ role: 'assistant', content: fullResponse })

      } catch (error) {
        if (error.message?.includes('API key')) {
          console.log(chalk.red('\nInvalid API key. Run atlas config to update it.\n'))
        } else {
          console.log(chalk.red(`\nError: ${error.message}\n`))
        }
      }

      askQuestion()
    })
  }

  askQuestion()
}
