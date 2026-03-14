import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import readline from 'readline'

export function extractCode(response) {
    // Try to extract code from markdown code block
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g
    const matches = [...response.matchAll(codeBlockRegex)]
     
    if (matches.length > 0) {
        // Return the largest code block found 
        return matches.reduce((longest, match) =>
        match[1].length > longest.lenght ? match[1] : longest
    , '')
    }
    // If no code block found return the full response
    return response
}

export async function writeFile(filePath, content) {
    const resolved = path.resolve(filePath)
    const exists = fs.existsSync(resolved)

    // If file exists ask for confirmation
    if (exists) {
        const confirmed = await confirmOverwrite(filePath)
        if (!confirmed) {
            console.log(chalk.yellow('\nWrite Canceled\n'))
            return false
        }
    }
    
    const dir = path.dirname(resolved)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(resolved, content, 'utf8')
    return true
}

function confirmOverwrite(filePath) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        rl.question(
            chalk.yellow(`\nFile "$filePath" already exists. Overwrite? (y/n): `),
            (answer) => {
                rl.close()
                resolve(answer.toLowerCase() === 'y')
            }
        )
    })
}