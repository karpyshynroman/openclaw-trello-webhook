export async function openclawInvoke({ gatewayUrl, token, tool, args = {}, action, sessionKey }) {
  if (!gatewayUrl) throw new Error('Missing gatewayUrl')
  if (!token) throw new Error('Missing token')

  const url = new URL('/tools/invoke', gatewayUrl)
  const body = { tool, args }
  if (action) body.action = action
  if (sessionKey) body.sessionKey = sessionKey

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  const text = await res.text().catch(() => '')
  if (!res.ok) {
    throw new Error(`OpenClaw invoke failed: HTTP ${res.status} ${text.slice(0, 300)}`)
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: true, raw: text }
  }

  if (data && data.ok === false) {
    throw new Error(`OpenClaw invoke error: ${data?.error?.message || JSON.stringify(data.error)}`)
  }

  return data
}

export async function openclawSendMessage({ target, message }) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789'
  const token = process.env.OPENCLAW_GATEWAY_TOKEN

  if (!target) throw new Error('Missing target (chat id)')

  return openclawInvoke({
    gatewayUrl,
    token,
    tool: 'message',
    action: 'send',
    args: {
      channel: 'telegram',
      target,
      message
    }
  })
}
