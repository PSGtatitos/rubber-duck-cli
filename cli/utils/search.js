import { tavily } from '@tavily/core'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-terminal' })

export async function searchWeb(query) {
  const client = tavily({ apiKey: config.get('tavilyApiKey') })

  const response = await client.search(query, {
    maxResults: 5,
    searchDepth: 'basic'
  })

  // Format results for Groq
  const formatted = response.results.map((r, i) => 
    `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`
  ).join('\n\n')

  return {
    formatted,
    urls: response.results.map(r => r.url)
  }
}