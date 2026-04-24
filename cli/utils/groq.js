import Groq from 'groq-sdk'
import Conf from 'conf'

const config = new Conf({ projectName: 'rubber-duck-cli' })

export async function askGroq(text, conversationHistory, searchResults = null) {
  const groq = new Groq({
    apiKey: config.get('groqApiKey')
  })

  const userMessage = searchResults
    ? `${text}\n\nHere are relevant web search results to help answer:\n\n${searchResults}\n\nUsing these results, please provide a comprehensive answer and cite the sources.`
    : text

  const stream = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are ATLAS, a helpful AI developer assistant living in the terminal. 
Be concise and clear. 
When given git context, use it to answer questions about the repository state, changes, and history.
When given file or project context, use it to answer questions about the code.
When given search results, synthesize them into a clear answer and cite sources.
Always base your answers on the context provided by the user.`
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