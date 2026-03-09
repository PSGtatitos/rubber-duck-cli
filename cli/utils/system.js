export function handleSystemCommand(text) {
  const t = text.toLowerCase()

  const commonSites = {
    youtube:   'https://youtube.com',
    google:    'https://google.com',
    netflix:   'https://netflix.com',
    github:    'https://github.com',
    reddit:    'https://reddit.com',
    twitter:   'https://twitter.com',
    instagram: 'https://instagram.com',
    gmail:     'https://gmail.com',
  }

  // Common site shortcuts
  for (const [name, url] of Object.entries(commonSites)) {
    if (t.includes(`open ${name}`)) {
      // Will be handled by agent tool in Phase 2
      return `Would open ${url} (system commands coming in v2)`
    }
  }

  // Search
  if (t.includes('search for') || t.includes('google search')) {
    const query = t.includes('search for')
      ? t.split('search for')[1].trim()
      : t.split('google search')[1].trim()
    return `Would search for "${query}" (system commands coming in v2)`
  }

  return null
}
