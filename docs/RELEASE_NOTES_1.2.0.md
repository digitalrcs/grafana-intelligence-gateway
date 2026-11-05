# Intelligence Gateway public 1.2.0

This public edition retains query-data analysis, provider/model selection, prompts, skills, limits, and PNG/JPEG uploads with preview, removal, and explicit **Analyze images** submission. Images-only and combined data/image assessments remain available through the required secure companion 1.1.0 or later.

New assessment workflows include evidence/freshness details, four analysis presets plus custom instructions, bounded sample statistics, comparison of two supplied current/baseline query results, frozen-text follow-up questions, and Markdown incident briefs with opt-in query evidence. Settings follow six numbered sections with an expandable setup checklist. See [the setup guide](SETUP.md) for examples and limits.

Statistics describe included samples only. Baseline history must be supplied by the configured queries. Follow-ups retain the original textual evidence and pause automatic analysis; successful image assessments release image files, so follow-ups cannot inspect those images again. Conversations remain temporary panel state.

Dashboard capture, panel discovery, selected-panel capture, and the `html-to-image` dependency are removed from public source and builds. Upload a locally saved PNG/JPEG when visual context is needed. PDF, CSV, and office-document uploads are not supported.

Use **Queries → Dashboard → Source panel** to share existing query results without duplicating the source query. Upload preparation does not inspect dashboard DOM or fetch source data. Grafana controls normal initial loads and scheduled refreshes.

The plugin ID is unchanged. Install only one edition per Grafana instance; restart Grafana and fully reload the browser after replacement. Existing dashboards need no automatic migration, but capture controls are no longer available. The companion remains shared and does not require an edition-specific release.

The public development stack uses port **3005** and a separate Compose project. A source/wiki upload does not establish a signed release or catalog approval. See [validation](../VALIDATION.md) and [submission preparation](GRAFANA_SUBMISSION.md) for pending gates.
