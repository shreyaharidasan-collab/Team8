# RBC Relay

An Early Talent support & feedback hub for RBC co-ops, built as a single-page demo with three views:

- **Weekly Check-In** — a 30-second mobile check-in with a department tag.
- **Open Dropbox** — an always-available place to vent, share a win or flag a blocker, with optional follow-up and anonymity.
- **Coordinator Command Center** — live sentiment, blockers, at-risk retention alerts and dropbox notes.

Demo state (check-ins, alerts, interventions, dropbox notes, last department) is saved in `localStorage`; use **Reset Demo Data** in the top bar to restore the defaults. Scoring, risk thresholds, seed data and dashboard calculations live in `src/lib/pulse.ts`.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
