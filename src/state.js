import fs from 'fs'
import path from 'path'

const STATE_PATH = process.env.STATE_PATH || path.join(process.cwd(), 'trello-state.json')

export function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'))
    // Backward compatible defaults
    s.processedCardIds ||= {}
    s.pendingApprovals ||= {}
    s.webhook ||= { id: null, callbackUrl: null, idModel: null }
    s.version ||= 1
    return s
  } catch {
    return {
      version: 1,
      processedCardIds: {},
      pendingApprovals: {},
      webhook: { id: null, callbackUrl: null, idModel: null }
    }
  }
}

export function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf-8')
}

export function markProcessed(state, cardId, meta = {}) {
  state.processedCardIds ||= {}
  state.processedCardIds[cardId] = { processedAt: new Date().toISOString(), ...meta }
}

export function isProcessed(state, cardId) {
  return Boolean(state?.processedCardIds?.[cardId])
}

export function addPending(state, cardId, meta = {}) {
  state.pendingApprovals ||= {}
  state.pendingApprovals[cardId] = { createdAt: new Date().toISOString(), ...meta }
}

export function removePending(state, cardId) {
  if (state?.pendingApprovals) delete state.pendingApprovals[cardId]
}
