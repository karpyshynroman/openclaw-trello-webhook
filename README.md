# OpenClaw Trello Webhook (Express)

Listens to Trello webhook events and reacts when a card is moved to the **Doing** list.

## What it does now
- Receives Trello webhook events at `POST /trello/webhook`
- Detects `updateCard` moves where `listAfter.name === Doing`
- Fetches the card (`name/desc/url`) via Trello API
- Writes a persistent state into `trello-state.json` so we don't process the same card twice
- Prints an analysis/plan to logs

> Safety note: This repo **does not execute arbitrary instructions** from a Trello card automatically.
> It produces an analysis + records state. If you want automation (create PRs, run scripts, etc.),
> define an allowlist of actions and require confirmation.

## Setup

```bash
npm i
cp .env.example .env
# fill .env
npm run start
```

Health check: `GET /health`

## Cloudflare Tunnel (quick)

Install `cloudflared`, then:

```bash
cloudflared tunnel --url http://localhost:3000
```

Copy the public URL and set:
- `WEBHOOK_CALLBACK_URL=https://<your-url>/trello/webhook`

## Create Trello webhook
You need a board id (idModel). Then:

```bash
export WEBHOOK_CALLBACK_URL="https://<your-url>/trello/webhook"
export TRELLO_IDMODEL="<board_id>"

npm run register:webhook
```

## State
State is stored in `trello-state.json`.
