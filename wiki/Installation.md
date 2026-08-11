# Installation

## Development

Use Node.js 22+, npm, Docker, and Docker Compose.

```bash
npm install
npm run dev
docker compose up
```

Open `http://localhost:3000`. The development compose configuration permits the unsigned plugin.

## Built artifact

Run `npm run build`; Grafana loads the generated `dist` directory under the plugin ID `digitalrcs-intelligencegateway-panel`. For production, install a signed release artifact. Restart Grafana after installing a new build or changing `plugin.json`.

Private instances can be signed with `npm run sign -- --rootUrls https://grafana.example.com/`. Catalog releases must meet Grafana's publishing and signature criteria.
