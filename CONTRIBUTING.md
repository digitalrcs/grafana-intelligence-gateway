# Contributing

Use Node.js 22+ and the npm version declared in `package.json`.

```bash
npm install
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

Run Grafana locally with `docker compose up` and use `npm run e2e` for Playwright coverage. Do not edit `.config/`; it is managed by Grafana Plugin Tools. Add tests for prompt, serialization, provider, and option behavior changes. Never commit credentials or dashboards containing them.
