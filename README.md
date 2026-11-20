# RBC Pulse

A single-page demo of RBC Early Talent & Co-op weekly pulse check-ins: a 30-second mobile check-in for students and a live Coordinator Command Center for sentiment, blockers and at-risk retention alerts.

- Demo state (check-ins, alerts, interventions) is saved in `localStorage`; use **Reset Demo Data** in the top bar to restore the defaults.
- Scoring, risk thresholds, seed data and dashboard calculations live in `src/lib/pulse.ts`.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Hosting note

This repository is connected to Lovable and syncs with the project's `main` branch. Avoid rewriting pushed history.
