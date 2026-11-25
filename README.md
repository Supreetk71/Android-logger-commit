# Trace — Android Logger OS Project Demo

A presentation-ready, interactive browser prototype for demonstrating the flow of a privacy-first activity logger. It is a **simulation**: the browser cannot read Android phone usage, and the Dropbox control does not contact Dropbox.

## Run it

Open `index.html` in a modern browser. For a local web server, run `python -m http.server 8000` in this folder and visit `http://localhost:8000`.

## Demo sequence

1. Point out the DEMO MODE label and the simulation/privacy notice.
2. Select **Enable logging** and confirm. The status changes to active.
3. Select **Simulate activity** to create a sample app session. The session appears in Recent activity and updates the summary, chart, and local pipeline.
4. Search/filter sessions, download the JSON log, or clear local history.
5. Select **Connect** in the Dropbox card. This changes only the simulated UI state.
6. Select **Sync now** to show a staged progress flow. The demo explicitly reports that no data was transmitted.
7. Use **Reset demo data** in the sidebar to restore the starting sample set.

## Concepts demonstrated

- Consent-gated event collection and pause controls.
- Event records with app/package name and session start/end times.
- Local persistence using browser `localStorage`.
- A human-triggered cloud sync workflow and app-folder scope concept.
- JSON export, event listing, filtering, summary metrics, and usage chart.

For a real Android implementation, an app would need Android's Usage Access grant to read the OS-provided app usage events. A real Dropbox connection would need a registered Dropbox app, OAuth 2.0 Authorization Code with PKCE, the narrow `files.content.write` scope, and an upload request to Dropbox's Files API.
