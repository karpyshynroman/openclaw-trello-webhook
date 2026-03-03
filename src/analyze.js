// Here is where "take the ticket and do the work" should be implemented.
// For safety, we only generate a plan/summary. You can later plug in actions (GitHub issue/PR, etc.).
export function analyzeCard(card) {
  const title = card?.name || ''
  const desc = card?.desc || ''

  const bullets = []
  if (desc) {
    const lines = desc.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    // take first few lines as "requirements"
    bullets.push(...lines.slice(0, 8))
  }

  return {
    summary: title,
    extractedRequirements: bullets,
    suggestedNextSteps: [
      'Confirm what output is expected (code/text/commit).',
      'Clarify deadline and acceptance criteria.',
      'Proceed in a branch + PR, then merge.'
    ]
  }
}
