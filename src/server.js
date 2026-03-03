import express from 'express'
import { loadState, saveState, isProcessed, markProcessed, addPending } from './state.js'
import { verifyTrelloSignature } from './trelloSignature.js'
import { trelloGet } from './trelloApi.js'
import { analyzeCard } from './analyze.js'
import { openclawSendMessage } from './openclawGateway.js'

const app = express()

const PORT = Number(process.env.PORT || 3000)
const DOING_LIST_NAME = process.env.DOING_LIST_NAME || 'Doing'
const WEBHOOK_CALLBACK_URL = process.env.WEBHOOK_CALLBACK_URL // required to verify signature
const TRELLO_SECRET = process.env.TRELLO_SECRET // optional but recommended

// Trello sends a HEAD request to validate webhook URL.
app.head('/trello/webhook', (req, res) => res.status(200).send('ok'))

// Need raw body for signature verification
app.post('/trello/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    const rawBody = req.body?.toString('utf-8') || ''

    if (TRELLO_SECRET) {
      const sig = req.get('x-trello-webhook') || ''
      const ok = verifyTrelloSignature({
        secret: TRELLO_SECRET,
        rawBody,
        callbackUrl: WEBHOOK_CALLBACK_URL,
        headerValue: sig
      })
      if (!ok) return res.status(401).send('invalid signature')
    }

    // Trello sometimes sends empty body pings; accept them.
    if (!rawBody) return res.status(200).send('ok')

    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return res.status(200).send('ok')
    }

    const action = payload?.action
    const type = action?.type

    // We care about card moves between lists (updateCard) with listAfter/listBefore.
    if (type !== 'updateCard') return res.status(200).send('ignored')

    const listAfter = action?.data?.listAfter?.name
    const listBefore = action?.data?.listBefore?.name
    const cardId = action?.data?.card?.id

    if (!cardId) return res.status(200).send('no card id')
    if (listAfter !== DOING_LIST_NAME) return res.status(200).send('not doing')

    const state = loadState()
    if (isProcessed(state, cardId)) return res.status(200).send('already processed')

    // Fetch full card
    const card = await trelloGet(`/cards/${cardId}`, {
      fields: 'name,desc,url,idList',
      attachments: 'false'
    })

    const analysis = analyzeCard(card)

    // Store a "pending approval" record for the assistant/human.
    addPending(state, cardId, {
      name: card?.name,
      url: card?.url,
      listBefore,
      listAfter,
      analysis,
      card: { name: card?.name, desc: card?.desc, url: card?.url }
    })

    // Mark processed so Trello retries / repeated moves don't spam.
    markProcessed(state, cardId, {
      name: card?.name,
      url: card?.url,
      listBefore,
      listAfter,
      analysis
    })

    saveState(state)

    console.log('--- OPENCLAW APPROVAL NEEDED ---')
    console.log('[DOING] Card moved to Doing:', card?.name)
    console.log('[URL]', card?.url)
    console.log('[ANALYSIS]', JSON.stringify(analysis, null, 2))
    console.log('-------------------------------')

    // Notify Roma in Telegram via OpenClaw Gateway (Tools Invoke API)
    // Requires:
    // - OPENCLAW_GATEWAY_TOKEN
    // - OPENCLAW_TARGET_CHAT (e.g. telegram:105322994)
    try {
      const target = process.env.OPENCLAW_TARGET_CHAT
      if (target) {
        const reqs = (analysis?.extractedRequirements || []).slice(0, 8)
        const reqText = reqs.length ? reqs.map((x) => `- ${x}`).join('\n') : '(no explicit requirements in description)'

        const msg = [
          '📝 Trello → Doing (approval needed)',
          `Title: ${card?.name}`,
          `URL: ${card?.url}`,
          '',
          'Extracted:',
          reqText,
          '',
          'Reply with:',
          `- approve ${cardId}  (start work)`,
          `- reject ${cardId}   (ignore)`
        ].join('\n')

        await openclawSendMessage({ target, message: msg })
      } else {
        console.log('[WARN] OPENCLAW_TARGET_CHAT not set; cannot notify Telegram')
      }
    } catch (e) {
      console.log('[WARN] Failed to notify Telegram via OpenClaw:', e?.message || e)
    }

    return res.status(200).send('ok')
  } catch (e) {
    console.error('Webhook error:', e)
    return res.status(200).send('ok')
  }
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`Webhook server listening on http://127.0.0.1:${PORT}`)
})
