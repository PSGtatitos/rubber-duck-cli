import chalk from 'chalk'
import ora from 'ora'
import fs from 'fs'
import path from 'path'
import { askGroq } from '../utils/groq.js'
import { searchWeb } from '../utils/search.js'
import { extractCode, writeFile } from '../utils/write.js'
import { getGitContext, isGitRepo } from '../utils/git.js'
import Conf from 'conf'

const config = new Conf({ projectName: 'rubber-duck-cli' })

const IGNORED = ['node_modules', '.git', '.env', 'dist', 'build']
const READABLE_EXTENSIONS = ['.js', '.ts', '.json', '.md', '.py', '.html', '.css', '.txt']

function attachFile(question, filePath) {
  const resolved = path.resolve(filePath)

  if (!fs.existsSync(resolved)) {
    console.log(chalk.red(`File not found: ${filePath}`))
    process.exit(1)
  }

  const stats = fs.statSync(resolved)
  if (stats.size > 50000) {
    console.log(chalk.red('File too large. Maximum size is 50kb.'))
    process.exit(1)
  }

  const fileContent = fs.readFileSync(resolved, 'utf8')
  const fileName = path.basename(resolved)

  return `${question}\n\nHere is the file "${fileName}":\n\`\`\`\n${fileContent}\n\`\`\``
}

function attachProject(question, projectPath) {
  const resolved = path.resolve(projectPath)

  if (!fs.existsSync(resolved)) {
    console.log(chalk.red(`Project not found: ${projectPath}`))
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

  const projectContent = readProject(resolved)
  const fullText = projectContent.join('\n')

  if (fullText.length > 40000) {
    console.log(chalk.yellow('Warning: Project is large, some files may be truncated.\n'))
  }

  return `${question}\n\nProject "${projectPath}" structure and contents:\n${fullText}`
}

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
    fullQuestion = attachFile(fullQuestion, options.file)
  }

  // Handle --project flag
  if (options.project) {
    fullQuestion = attachProject(fullQuestion, options.project)
  }

  // Handle --git flag
  if (options.git) {
    if (!isGitRepo()) {
      console.log(chalk.red('Not a git repository.'))
      process.exit(1)
    }

    const gitContext = getGitContext()
    if (gitContext) {
      fullQuestion = `${fullQuestion}\n\nHere is the current git context:\n\`\`\`\n${gitContext}\n\`\`\``
      console.log(chalk.gray('Git context loaded.\n'))
    }
  }

  const spinner = ora('Thinking...').start()

  try {
    let searchResults = null
    let urls = []

    // Handle --search flag
    if (options.search) {
      if (!config.get('tavilyApiKey')) {
        spinner.stop()
        console.log(chalk.red('Tavily API key not set. Run atlas config to add it.'))
        process.exit(1)
      }

      spinner.text = 'Searching the web...'
      const results = await searchWeb(fullQuestion)
      searchResults = results.formatted
      urls = results.urls
    }

    spinner.stop()
    process.stdout.write(chalk.blue('ATLAS: '))

    let stream = await askGroq(fullQuestion, [], searchResults)
    let fullResponse = ''

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || ''
      process.stdout.write(token)
      fullResponse += token

      if (chunk.choices[0]?.finish_reason === 'length') {
        await new Promise(resolve => setTimeout(resolve, 1000))
        stream = await askGroq(fullResponse, [
          { role: 'user', content: fullQuestion },
          { role: 'assistant', content: fullResponse },
          { role: 'user', content: 'Please continue.' }
        ])
      }
    }

    // Print sources if search was used
    if (urls.length > 0) {
      console.log('\n' + chalk.gray('Sources:'))
      urls.forEach(url => console.log(chalk.gray(`→ ${url}`)))
    }

    // Handle --write flag
    if (options.write) {
      const code = extractCode(fullResponse)
      const written = await writeFile(options.write, code)
      if (written) {
        console.log('\n' + chalk.green(`✓ Written to ${options.write}`))
      }
    }

    console.log('\n')

  } catch (error) {
    spinner.stop()
    if (error.status === 429) {
      console.log(chalk.red('Rate limit reached. Please wait a moment before trying again.'))
    } else if (error.message?.includes('API key')) {
      console.log(chalk.red('Invalid API key. Run atlas config to update it.'))
    } else if (error.message?.includes('tavily')) {
      console.log(chalk.red('Tavily API key missing or invalid. Run atlas config to set it up.'))
    } else {
      console.log(chalk.red(`Error: ${error.message}`))
    }
    process.exit(1)
  }
}