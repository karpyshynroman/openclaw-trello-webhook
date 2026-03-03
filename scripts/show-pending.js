import { loadState } from '../src/state.js'

const s = loadState()
const pending = s.pendingApprovals || {}
const ids = Object.keys(pending)

if (ids.length === 0) {
  console.log('(no pending approvals)')
  process.exit(0)
}

for (const id of ids) {
  const p = pending[id]
  console.log(`- ${p?.name || id}`)
  console.log(`  id: ${id}`)
  console.log(`  url: ${p?.url || ''}`)
  console.log(`  createdAt: ${p?.createdAt}`)
  if (p?.analysis) console.log(`  analysis: ${JSON.stringify(p.analysis)}`)
}
