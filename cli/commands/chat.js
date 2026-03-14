import readline from 'readline'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { askGroq } from '../utils/groq.js'
import { searchWeb } from '../utils/search.js'
import { handleSystemCommand } from '../utils/system.js'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-terminal' })

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
const IGNORED = ['node_modules', '.git', '.env', 'dist', 'build']
const READABLE_EXTENSIONS = ['.js', '.ts', '.json', '.md', '.py', '.html', '.css', '.txt']

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

  const readProject = (pathToRead, level = 0) => {
    const result = []
    const dirContent = fs.readdirSync(pathToRead)

    for (const item of dirContent) {
      if (IGNORED.includes(item)) continue

      const fullPath = path.join(pathToRead, item)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        result.push(`\n${'  '.repeat(level)}📁 ${item}/`)
        result.push(...readProject(fullPath, level + 1))
      } else if (stats.isFile()) {
        const ext = path.extname(item)
        result.push(`\n${'  '.repeat(level)}📄 ${item}`)

        if (READABLE_EXTENSIONS.includes(ext) && stats.size < 20000) {
          const content = fs.readFileSync(fullPath, 'utf8')
          result.push(`${'  '.repeat(level + 1)}\`\`\`\n${content}\n\`\`\``)
        }
      }
    }

    return result
  }

  const projectContent = readProject(resolved)
  const fullText = projectContent.join('\n')

  if (fullText.length > 40000) {
    console.log(chalk.yellow('Warning: Project is large, some files may be truncated.\n'))
  }

  return `${question}\n\nProject "${projectPath}" structure and contents:\n${fullText}`
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

  // If project passed at startup load it into context
  if (options.project) {
    const projectPath = path.resolve(options.project)

    if (!fs.existsSync(projectPath)) {
      console.log(chalk.red(`Project not found: ${options.project}`))
      process.exit(1)
    }

    const readProject = (pathToRead, level = 0) => {
      const result = []
      const dirContent = fs.readdirSync(pathToRead)

      for (const item of dirContent) {
        if (IGNORED.includes(item)) continue

        const fullPath = path.join(pathToRead, item)
        const stats = fs.statSync(fullPath)

        if (stats.isDirectory()) {
          result.push(`\n${'  '.repeat(level)}📁 ${item}/`)
          result.push(...readProject(fullPath, level + 1))
        } else if (stats.isFile()) {
          const ext = path.extname(item)
          result.push(`\n${'  '.repeat(level)}📄 ${item}`)

          if (READABLE_EXTENSIONS.includes(ext) && stats.size < 20000) {
            const content = fs.readFileSync(fullPath, 'utf8')
            result.push(`${'  '.repeat(level + 1)}\`\`\`\n${content}\n\`\`\``)
          }
        }
      }

      return result
    }

    const projectContent = readProject(projectPath)
    const fullText = projectContent.join('\n')

    if (fullText.length > 40000) {
      console.log(chalk.yellow('Warning: Project is large, some files may be truncated.\n'))
    }

    conversationHistory.push({
      role: 'user',
      content: `I'm going to ask you questions about this project:\n${fullText}`
    })
    conversationHistory.push({
      role: 'assistant',
      content: `Got it! I've read the project structure and contents. What would you like to know?`
    })

    console.log(chalk.gray(`\nLoaded project: ${options.project}\n`))
  }

  console.log(chalk.cyan('─'.repeat(50)))
  console.log(chalk.cyan('  ATLAS — type your message, or "exit" to quit'))
  console.log(chalk.cyan('  Tip: attach a file with --file path/to/file'))
  console.log(chalk.cyan('  Tip: attach a project with --project path/to/project'))
  console.log(chalk.cyan('  Tip: search the web with --search in your message'))
  console.log(chalk.cyan('─'.repeat(50)) + '\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const askQuestion = () => {
    rl.question(chalk.green('You: '), async (input) => {
      let userInput = input.trim()

      if (!userInput) {
        return askQuestion()
      }

      if (STOP_PHRASES.some(p => userInput.toLowerCase().includes(p))) {
        console.log(chalk.cyan('\nATLAS: Goodbye!\n'))
        rl.close()
        return
      }

      if (
        userInput.length < MIN_INPUT_LENGTH ||
        NOISE_WORDS.has(userInput.toLowerCase())
      ) {
        console.log(chalk.gray('[Skipped] Input too short.\n'))
        return askQuestion()
      }

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

      // Web search check
      let searchResults = null
      let searchUrls = []

      if (userInput.includes('--search')) {
        userInput = userInput.replace('--search', '').trim()

        if (!config.get('tavilyApiKey')) {
          console.log(chalk.red('Tavily API key not set. Run atlas config to add it.\n'))
          return askQuestion()
        }

        process.stdout.write(chalk.gray('Searching the web...\n'))

        try {
          const results = await searchWeb(userInput)
          searchResults = results.formatted
          searchUrls = results.urls
        } catch (error) {
          console.log(chalk.red('Search failed. Continuing without web results.\n'))
        }
      }

      const systemResponse = handleSystemCommand(userInput)
      if (systemResponse) {
        console.log(chalk.yellow(`System: ${systemResponse}\n`))
        return askQuestion()
      }

      try {
        process.stdout.write(chalk.blue('ATLAS: '))

        let stream = await askGroq(userInput, conversationHistory, searchResults)
        let fullResponse = ''

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || ''
          process.stdout.write(token)
          fullResponse += token

          if (chunk.choices[0]?.finish_reason === 'length') {
            await new Promise(resolve => setTimeout(resolve, 1000))
            stream = await askGroq(fullResponse, [
              ...conversationHistory,
              { role: 'user', content: userInput },
              { role: 'assistant', content: fullResponse },
              { role: 'user', content: 'Please continue.' }
            ])
          }
        }

        // Print sources if search was used
        if (searchUrls.length > 0) {
          console.log('\n' + chalk.gray('Sources:'))
          searchUrls.forEach(url => console.log(chalk.gray(`→ ${url}`)))
        }

        console.log('\n')

        conversationHistory.push({ role: 'user', content: userInput })
        conversationHistory.push({ role: 'assistant', content: fullResponse })

      } catch (error) {
        if (error.status === 429) {
          console.log(chalk.red('\nRate limit reached. Please wait a moment.\n'))
        } else if (error.message?.includes('API key')) {
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