// groq.js
import Groq from 'groq-sdk'
import Conf from 'conf'

const config = new Conf({ projectName: 'atlas-cli' })

export async function askGroq(text, conversationHistory) {
  const groq = new Groq({ 
    apiKey: config.get('groqApiKey') 
  })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are ATLAS, an AI assistant in the terminal.'
      },
      ...conversationHistory,
      { role: 'user', content: text }
    ],
    stream: true  // streaming so responses print token by token
  })

  return response
}
