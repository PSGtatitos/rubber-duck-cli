import readline from 'readline'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
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

function attachFile(userInput) {
  if (!userInput.includes('--file')) return userInput

  const parts = userInput.split('--file')
  const question = parts[0].trim()
  const filePath = parts[1].trim()
  const resolved = path.resolve(filePath)

  if (!fs.existsSync(resolved)) {
    console.log(chalk.red(`File not found: ${filePath}\n`))
    return null
  }

  const stats = fs.statSync(resolved)
  if (stats.size > 50000) {
    console.log(chalk.red('File too large. Maximum size is 50kb.\n'))
    return null
  }

  const fileContent = fs.readFileSync(resolved, 'utf8')
  const fileName = path.basename(resolved)

  return `${question}\n\nHere is the file "${fileName}":\n\`\`\`\n${fileContent}\n\`\`\``
}

function attachProject(userInput) {
  if (!userInput.includes('--project')) return userInput

  const parts = userInput.split('--project')
  const question = parts[0].trim()
  const projectPath = parts[1].trim()
  const resolved = path.resolve(projectPath)

  if (!fs.existsSync(resolved)) {
    console.log(chalk.red(`Project not found: ${projectPath}`))
    return null
  }

  const projectFiles = fs.readdirSync(resolved)
  const projectContent = projectFiles.map(file => {
    const filePath = path.join(resolved, file)
    const stats = fs.statSync(filePath)

    if (stats.isFile()) {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      return `File: ${file}\n${fileContent}`
    } else if (stats.isDirectory()) {
      return `Directory: ${file}`
    }
  }).join('\n\n')

  return `${question}\n\nProject "${projectPath}" contents:\n\`\`\`\n${projectContent}\n\`\`\``
}
export async function chatCommand(options) {
  if (!config.get('groqApiKey')) {
    console.log(chalk.red('No API key found. Run atlas config first.'))
    process.exit(1)
  }

  const conversationHistory = []

  // If file passed at startup load it into context
  if (options.file) {
    const filePath = path.resolve(options.file)

    if (!fs.existsSync(filePath)) {
      console.log(chalk.red(`File not found: ${options.file}`))
      process.exit(1)
    }

    const stats = fs.statSync(filePath)
    if (stats.size > 50000) {
      console.log(chalk.red('File too large. Maximum size is 50kb.'))
      process.exit(1)
    }

    const fileContent = fs.readFileSync(filePath, 'utf8')
    const fileName = path.basename(filePath)

    conversationHistory.push({
      role: 'user',
      content: `I'm going to ask you questions about this file "${fileName}":\n\`\`\`\n${fileContent}\n\`\`\``
    })
    conversationHistory.push({
      role: 'assistant',
      content: `Got it! I've read "${fileName}". What would you like to know about it?`
    })

    console.log(chalk.gray(`\nLoaded: ${fileName}\n`))
  }

  console.log(chalk.cyan('─'.repeat(50)))
  console.log(chalk.cyan('  ATLAS — type your message, or "exit" to quit'))
  console.log(chalk.cyan('  Tip: attach a file with --file path/to/file'))
  console.log(chalk.cyan('─'.repeat(50)) + '\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const askQuestion = () => {
    rl.question(chalk.green('You: '), async (input) => {
      let userInput = input.trim()

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

      // File attachment check
      if (userInput.includes('--file')) {
        const withFile = attachFile(userInput)
        if (!withFile) return askQuestion()
        userInput = withFile
      }
      if (userInput.includes('--project')) {
        const withProject = attachProject(userInput)
        if (!withProject) return askQuestion()
        userInput = withProject
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