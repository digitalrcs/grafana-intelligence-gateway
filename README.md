# Grafana Intelligence Gateway

[![CI](https://github.com/DigitalRCS/grafana-intelligence-gateway/actions/workflows/ci.yml/badge.svg)](https://github.com/DigitalRCS/grafana-intelligence-gateway/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Grafana Intelligence Gateway is a panel plugin by **DigitalRCS** that turns Grafana DataFrames into focused AI assessments. It supports OpenAI, LM Studio, custom OpenAI-compatible chat-completions APIs, and an experimental Copilot Studio messaging mode.

Plugin ID: `digitalrcs-intelligencegateway-panel`  
Grafana: `>=11.6.0` (the multi-version GitHub Actions E2E matrix is the compatibility authority)

![Grafana Intelligence Gateway assessment and configuration](docs/images/configuration-model-generation.png)

For the complete setup guide, every panel option, example values, provider-specific instructions, and troubleshooting, use the [GitHub Wiki](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki).

## Features

- Reads time-series and table query results from `PanelProps.data.series`.
- Serializes field names, types, labels, units, recent rows, and the active time range.
- Supports `{{data}}`, `{{timeRange}}`, `{{panelTitle}}`, `{{panelId}}`, `{{skills}}`, and `{{sourcePanel}}` prompt variables plus Grafana dashboard variables.
- Provides system instructions, a user template, reusable skills/context, and a live constructed-prompt preview.
- Offers manual analysis, a clear-analysis control, optional debounced auto-analysis, context-size controls, buffered requests, and OpenAI-compatible SSE streaming.
- Renders sanitized Markdown through Grafana UI with theme-aware colors, loading state, actionable errors, and configurable typography/layout.

## Security boundary

This is a frontend-only panel. **Panel options cannot use Grafana `secureJsonData`; any API key or token saved here is serialized into dashboard JSON and may be readable by users with dashboard access.** The editor masks the input but does not make storage secure.

Use only restricted development credentials in panel options. For production, add a Grafana backend/data-source component that owns secrets in `secureJsonData`, allow-lists provider hosts, applies authentication server-side, and proxies requests. Never export or commit dashboards containing real credentials.

## Install for development

Requirements: Node.js 22+, npm, Docker, and Docker Compose. The official scaffold CLI supports Linux/macOS; on Windows use WSL for scaffolding.

```bash
npm install
npm run dev
docker compose up
```

Open <http://localhost:3000> and sign in with `admin` / `admin`. The development compose file enables loading the unsigned plugin.

Production build:

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

## Connect data from another panel

The reliable public-API route is Grafana's built-in **Dashboard** data source:

1. Add Grafana Intelligence Gateway to the dashboard.
2. In its query editor, select the `-- Dashboard --` data source.
3. Select the source panel whose query results should be reused.
4. Apply Grafana transformations if you need to reduce or reshape the input.
5. Set **Recent rows per frame** and **Maximum context characters** to control payload size.
6. Select **Analyze**.

The **Source panel title or ID (hint)** option adds a label to the prompt; it does not fetch another panel. Grafana does not expose another panel's live query result through a stable public runtime API. Depending on private dashboard-model internals would reduce compatibility and catalog readiness.

For screenshots-independent, step-by-step instructions, transformation choices, dashboard JSON, multiple-frame behavior, and troubleshooting, see [Connecting data from another Grafana panel](docs/CONNECTING_DATA.md).

The illustrated setup walkthrough is in [Panel Setup and Configuration](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Panel-Setup-and-Configuration).

## Provider configuration

### OpenAI

- Provider: **OpenAI**
- Base URL: `https://api.openai.com/v1`
- Model: an available chat-completions model such as `gpt-4.1-mini`
- API key: development only in this frontend version

### LM Studio

- Start LM Studio's local server and load a model.
- Provider: **LM Studio**
- Base URL: usually `http://localhost:1234/v1`
- Model: the identifier reported by LM Studio
- Enable CORS in LM Studio for the Grafana origin. When Grafana runs in Docker, `localhost` in the browser still refers to the user's machine, but network and browser mixed-content policy must permit the request.

### Custom / OpenAI-compatible

Enter the base URL up to `/v1`; the panel appends `/chat/completions`. Configure the model and optional bearer token. The endpoint must accept the OpenAI message schema and permit requests from the Grafana origin.

### Copilot Studio (experimental)

Enter a complete Direct Line or messaging endpoint and optional bearer token. The panel sends a generic message activity with the system prompt in `channelData`. Copilot bot/channel contracts vary, so production integration normally needs a backend token exchange and endpoint-specific adapter. Streaming is not enabled in this mode.

## Prompt design

The default template keeps instructions and data separate. Put stable role/risk rules in **System / backend prompt**, the task and variables in **User message template**, and domain definitions/runbooks in **Skills / additional context**.

Treat dashboard data and labels as untrusted content. Tell the model not to follow instructions embedded in data. Keep row and character caps conservative, especially when logs contain arbitrary user text.

## Signing and packaging

The generated CI builds, tests, signs when `GRAFANA_ACCESS_POLICY_TOKEN` is present, packages the plugin directory as a ZIP, and runs the metadata validator. The release workflow uses `grafana/plugin-actions/build-plugin` on `v*` tags.

For private signing with allowed roots:

```bash
export GRAFANA_ACCESS_POLICY_TOKEN="..."
npm run build
npm run sign -- --rootUrls https://grafana.example.com/
```

For community catalog signing, ensure the `digitalrcs` prefix matches the Grafana Cloud organization slug, configure the `GRAFANA_ACCESS_POLICY_TOKEN` GitHub secret after Grafana grants a public signature level, create a GitHub release from the exact source tag, and submit the artifact through Grafana's plugin submission process. Restart Grafana after any `plugin.json` change.

See [Grafana Compatibility and Certification](docs/CERTIFICATION.md) for the current readiness checklist and the exact submission fields.

## Repository map

- `src/components/IntelligenceGatewayPanel.tsx` — runtime UI and analysis lifecycle.
- `src/utils/aiClient.ts` — provider transports, streaming, response/error normalization.
- `src/utils/dataFrames.ts` — bounded, label-aware DataFrame serialization.
- `src/utils/prompt.ts` — prompt-template construction.
- `src/module.ts` — panel option registration.
- `provisioning/dashboards/dashboard.json` — local development dashboard.
- `examples/dashboard.json` — importable configuration example.
- `wiki/` — source for the published GitHub Wiki pages.

## Roadmap

- Backend proxy and `secureJsonData` secret storage.
- Host allow-listing, server-side audit controls, and per-user/provider quotas.
- Provider-specific adapters for OpenAI Responses API and Copilot conversations.
- Multi-panel context selection using supported Grafana APIs as they become available.
- Response persistence, citations back to fields/timestamps, and richer streaming controls.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the [wiki](wiki/Home.md).
