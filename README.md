# Grafana Intelligence Gateway

Analyze Grafana query results and uploaded images with your AI backend or Copilot Studio agent.

Connect **OpenAI**, **LM Studio**, **Open WebUI**, the optional **Grafana LLM app**, a **custom OpenAI-compatible endpoint**, or **Copilot Studio Direct Line (preview)** through the required **Intelligence Gateway Secure AI** data source. Provider credentials stay on the Grafana server. You choose the backend and approved model or agent; no AI connection or model is selected for you.

Public edition **1.2.1**. Requires **Grafana 11.6+** and companion **1.1.0+**; use security-fixed companion **1.1.2+**. The optional Grafana LLM app has separate version requirements. Copilot Direct Line is an implemented preview integration, not corporate SSO or delegated Entra authentication.

## Connect and analyze

1. **Connect your backend.** Install the [Secure AI companion](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource). In **Connections → Data sources**, add an Intelligence Gateway Secure AI instance. Choose the provider, endpoint and approved model, or configure Copilot Studio’s Direct Line endpoint, secure channel secret and agent alias. Select **Save & test**.
2. **Select it in the panel.** Open **1. Connect AI**, select the configured instance, and load or enter its model ID or agent alias. Analyze becomes available when both are selected.
3. **Choose evidence.** Use **Queries → Dashboard → Source panel** to reuse existing query results, or configure queries directly. For images, open **Images**, upload PNG/JPEG files and review the previews. Images-only analysis does not require a query.
4. **Choose a task.** Select an analysis preset or keep your custom instructions. Add team definitions or runbooks under **3. Analysis task**.
5. **Analyze.** Select **Analyze** for query data or **Analyze images** for reviewed attachments. Inspect the assessment, expand **Evidence**, **Ask a follow-up**, or **Share assessment** as needed.

The AI connection selects the model; the Queries tab supplies measurements. [Setup guide](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Panel-Setup-and-Configuration) · [Provider setup](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Configuration-AI-Providers) · [Copilot Studio setup](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Copilot-Studio-Notes)

## Analysis capabilities

- **Presets and custom prompts:** explain spikes, compare series, summarize for handover, check data quality, or provide your own instructions and reusable context.
- **Calculated statistics:** include bounded sample summaries with explicit gauge, counter or unknown semantics. Statistics describe included samples, not full-window or time-weighted estimates.
- **Baseline comparison:** compare two supplied query reference IDs. Configure the historical window in the source query; compatible unique gauge fields receive calculated differences.
- **Evidence and freshness:** inspect the model, source, time range and included/omitted rows. Changes mark the assessment out of date.
- **Snapshot follow-ups:** ask up to six questions using the original textual evidence. Automatic analysis pauses during a conversation; Analyze latest data starts a fresh snapshot.
- **Incident briefs:** copy or download Markdown with context and follow-ups. Query evidence is optional and excluded by default.
- **Image analysis:** PNG/JPEG upload, preview, removal and explicit submission, with or without query data. An administrator-approved vision model is required.
- **Controls:** manual or debounced automatic data analysis, cancellation, clearing, prompt previews, row/character limits, output budgets, timeouts and display customization.

Settings follow six sections: **Connect AI**, **Choose evidence**, **Analysis task**, **Results and sharing**, **Advanced prompts and limits**, and **Appearance**. Existing saved prompts and options remain supported.

## Data and images

Keep `{{data}}` in the prompt to include query evidence; use `{{skills}}` for reusable team context. DataFrames carry field names, labels, units and bounded rows. For images-only analysis, disable **Include query data with images**. Images are never sent automatically and are released after successful analysis. Reattach them for a new visual assessment; follow-ups cannot re-inspect released images.

The public edition does not capture dashboards or other panels. PDF, CSV and office-file uploads are not implemented. [Image guide](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Image-Analysis)

## Where your data goes

Selected query evidence, prompts, context and explicitly submitted images go to your configured provider through the companion backend. A local provider supports processing in your environment; hosted providers process the supplied content externally. Credentials remain in Grafana encrypted data-source settings, never panel options or dashboard JSON. Administrators control endpoints, allowed models and request limits.

Assessments and conversations are temporary panel state, not saved with the dashboard. Exported briefs are user-managed files or clipboard contents. Review conclusions against the source measurements; model quality and image understanding depend on your provider and model.

## Documentation and support

- [User documentation](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki)
- [Connect query data](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Connecting-Data-from-Other-Panels)
- [Secure backend](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Secure-Backend-and-Secrets)
- [Report an issue](https://github.com/digitalrcs/grafana-intelligence-gateway/issues)
- [Source and Apache 2.0 license](https://github.com/digitalrcs/grafana-intelligence-gateway)

Developed by [DigitalRCS](https://digitalrcs.com).

[Download public 1.2.1](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/tag/v1.2.1) · [Verified release and catalog status](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Grafana-Compatibility-and-Certification)
