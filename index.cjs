//Imports
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv/config');
const app = express();

app.use(express.json({ limit: '50mb' }));

//Ask Endpoint
app.post('/api/ask', async (req, res) => {
  try {
    console.log('Received request with keys:', Object.keys(req.body));
    const { text, context, conversationHistory } = req.body;

    const now = new Date();
    const timeString = now.toLocaleTimeString('el-GR', {
      timeZone: 'Europe/Athens',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    let systemPrompt = "You are ATLAS, a helpful AI assistant. Be brief and concise.";

    if (context) {
      systemPrompt += ` Current time: ${timeString}.`;
      if (context.temperature) systemPrompt += ` Temp: ${context.temperature}°C.`;
      if (context.humidity)    systemPrompt += ` Humidity: ${context.humidity}%.`;
      if (context.location)    systemPrompt += ` Location: ${context.location}.`;
    }

    console.log('Making request to Groq...');

    const messages = [{ role: 'system', content: systemPrompt }];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      console.log(`Adding ${conversationHistory.length} messages from history`);
      messages.push(...conversationHistory);
    }

    messages.push({ role: 'user', content: text });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    console.log('Response status:', response.status);

    const data = await response.json();

    if (process.env.DEBUG) {
      console.log('Full API response:', JSON.stringify(data, null, 2));
    }

    if (data.error) {
      return res.status(400).json({ error: 'Groq error', details: data.error });
    }

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({ error: 'No response from AI', fullResponse: data });
    }

    res.json({
      response: answer,
      conversationHistory: [
        ...(conversationHistory || []),
        { role: 'user', content: text },
        { role: 'assistant', content: answer }
      ]
    });

  } catch (error) {
    console.error('Caught error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// System commands endpoint
app.post('/api/system-commands', async (req, res) => {
  try {
    const { action, parameter } = req.body;

    console.log(`System command: ${action} ${parameter || ''}`);

    let command;

    switch (action) {
      case 'open-url':
        if (process.platform === 'win32') command = `start "" "${parameter}"`;
        break;

      case 'open-app':
        if (process.platform === 'win32') command = `start "" "${parameter}"`;
        break;

      case 'search-google':
        const query = encodeURIComponent(parameter);
        const url = `https://google.com/search?q=${query}`;
        if (process.platform === 'win32') command = `start "" "${url}"`;
        break;

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    exec(command, (error) => {
      if (error) {
        console.error('Command error:', error);
        return res.status(500).json({ error: error.message });
      }
      console.log(`Executed: ${action}`);
      res.json({ success: true, message: `Executed: ${action}` });
    });

  } catch (error) {
    console.error('System command error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`ATLAS API running on port ${PORT}`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use. Set PORT env or free the port.`);
    process.exit(1);
  }
  console.error('Server error:', err);
});