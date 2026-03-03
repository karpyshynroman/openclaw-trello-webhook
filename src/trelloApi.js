export async function trelloGet(path, params = {}) {
  const key = process.env.TRELLO_KEY
  const token = process.env.TRELLO_TOKEN
  if (!key || !token) throw new Error('Missing TRELLO_KEY/TRELLO_TOKEN env vars')

  const url = new URL(`https://api.trello.com/1/${path.replace(/^\//,'')}`)
  url.searchParams.set('key', key)
  url.searchParams.set('token', token)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Trello GET ${url.pathname} failed: ${res.status} ${text.slice(0,200)}`)
  }
  return res.json()
}
