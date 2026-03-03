const key = process.env.TRELLO_KEY
const token = process.env.TRELLO_TOKEN
if (!key || !token) throw new Error('Missing TRELLO_KEY/TRELLO_TOKEN')

const url = new URL('https://api.trello.com/1/tokens/' + token + '/webhooks')
url.searchParams.set('key', key)

const res = await fetch(url)
const text = await res.text()
if (!res.ok) throw new Error(`Failed to list webhooks: ${res.status} ${text}`)

const data = JSON.parse(text)
for (const w of data) {
  console.log(`- ${w.id} → ${w.callbackURL} (idModel=${w.idModel})`)
}
