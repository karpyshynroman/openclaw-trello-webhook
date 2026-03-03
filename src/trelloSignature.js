import crypto from 'crypto'

// Trello webhook signature:
// header: x-trello-webhook = base64(hmac-sha1(secret, rawBody + callbackURL))
export function verifyTrelloSignature({ secret, rawBody, callbackUrl, headerValue }) {
  if (!secret || !rawBody || !callbackUrl || !headerValue) return false
  const content = rawBody + callbackUrl
  const digest = crypto.createHmac('sha1', secret).update(content).digest('base64')
  // timing-safe compare
  const a = Buffer.from(digest)
  const b = Buffer.from(headerValue)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
