import Groq from 'groq-sdk'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-terminal' })

export async function askGroq(text, conversationHistory, searchResults = null) {
  const groq = new Groq({
    apiKey: config.get('groqApiKey')
  })

  // If search results provided, inject them into the prompt
  const userMessage = searchResults
    ? `${text}\n\nHere are relevant web search results to help answer:\n\n${searchResults}\n\nUsing these results, please provide a comprehensive answer and cite the sources.`
    : text

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are ATLAS, a helpful AI assistant living in the terminal. Be concise and clear. When given search results, synthesize them into a clear answer and always cite your sources.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ],
    stream: true
  })

  return stream
}