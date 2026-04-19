export async function fetchJson(url, init) {
  const response = await fetch(url, init)
  const text = await response.text()

  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      const type = response.headers.get('content-type') || 'unknown content type'
      const preview = text.replace(/\s+/g, ' ').trim().slice(0, 120)
      throw new Error(`Expected JSON from ${url}, received ${type}${preview ? `: ${preview}` : ''}`)
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`)
  }

  return data
}
