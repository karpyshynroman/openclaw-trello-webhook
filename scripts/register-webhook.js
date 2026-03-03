import { loadState, saveState } from '../src/state.js'

const key = process.env.TRELLO_KEY
const token = process.env.TRELLO_TOKEN
const callbackURL = process.env.WEBHOOK_CALLBACK_URL
const idModel = process.env.TRELLO_IDMODEL // board id (or list id), usually a board id

if (!key || !token) throw new Error('Missing TRELLO_KEY/TRELLO_TOKEN')
if (!callbackURL) throw new Error('Missing WEBHOOK_CALLBACK_URL')
if (!idModel) throw new Error('Missing TRELLO_IDMODEL (e.g. board id)')

const url = new URL('https://api.trello.com/1/webhooks')
url.searchParams.set('key', key)
url.searchParams.set('token', token)

const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ callbackURL, idModel, description: 'OpenClaw Doing webhook' })
})

const text = await res.text()
if (!res.ok) throw new Error(`Failed to create webhook: ${res.status} ${text}`)

const data = JSON.parse(text)
const state = loadState()
state.webhook = { id: data.id, callbackUrl: callbackURL, idModel }
saveState(state)

console.log('Webhook created:', data.id)
console.log('Callback:', callbackURL)
console.log('Model:', idModel)
