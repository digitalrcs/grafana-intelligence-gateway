# Panel Setup and Configuration

Grafana Intelligence Gateway analyzes normal Grafana DataFrames. The recommended source is Grafana's built-in **Dashboard** data source, which reuses another panel's query results without private dashboard APIs or duplicated queries.

## 1. Configure the required secure data source

Install `digitalrcs-intelligencegateway-datasource`, then create an **Intelligence Gateway Secure AI** data-source instance.

1. Select the provider: OpenAI, LM Studio, or Custom/OpenAI-compatible.
2. Configure the administrator-controlled base URL.
3. Set a default model and include it in **Allowed models**. If the list is empty, only the default model is permitted.
4. Set the backend timeout and maximum output-token ceiling.
5. Store an API key or bearer token only in its `secureJsonData` field. LM Studio may need neither.
6. Keep HTTPS enabled. Use **Allow insecure HTTP** only for a trusted local development network.
7. Select **Save & test**.

See [Secure Backend and Secret Storage](Secure-Backend-and-Secrets) for provisioning and policy details.

## 2. Add the source panel

Create or identify a panel that returns the data to analyze. Time series, tables, logs, and other query results are accepted when Grafana exposes them as DataFrames. Confirm that the source returns data for the active dashboard time range.

## 3. Add the Intelligence Gateway panel

1. Select **Add visualization**.
2. Choose **Grafana Intelligence Gateway**.
3. In **Queries**, select the `-- Dashboard --` data source.
4. Under **Source panel**, select the panel whose results should be analyzed.
5. Choose **All data** unless annotations are specifically required.
6. Save the dashboard.

The **Source panel title or ID (hint)** is descriptive prompt metadata only. The Dashboard data source performs the actual connection.

![Dashboard data source and source panel selection](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/docs/images/configuration-data-context.png)

## 4. Configure AI generation

| Option | Purpose | Example | Guidance |
| --- | --- | --- | --- |
| **Secure AI data source** | Selects the backend instance by UID. | `Intelligence Gateway Secure AI` | Required. The panel stores only the UID. |
| **Model** | Chooses an administrator-approved model. | `review-model` | Use **Load models securely** or enter an allowed ID. |
| **Temperature** | Controls response randomness. | `0.2` | Use 0–0.3 for repeatable operational analysis. |
| **Provider/model default output limit** | Omits the panel request cap. | Off | The backend administrator ceiling and provider limits still apply. |
| **Maximum output tokens** | Hard panel request cap. | `1200` | Slider range is 64–1,048,576; the backend applies the lower panel/admin cap. |
| **Requested answer max tokens (soft)** | Adds a concision instruction. | `0` | Zero disables it. Models cannot guarantee exact token counts. |
| **Response timeout** | Cancels the panel wait. | `300` | Range is 10–600 seconds. Align it with the backend timeout. |

The panel is buffered and cancellable. Provider credentials, URLs, authentication headers, and provider error bodies never enter panel options.

![Secure data source, model, and generation controls](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/docs/images/configuration-model-generation.png)

After analysis, the generated assessment appears in the panel together with **Clear analysis** and **Refresh assessment**. **Clear analysis** cancels an active request and removes the generated answer or error without modifying the dashboard query or source data.

![Completed secure-backend analysis and runtime controls](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/docs/images/production-secure-analysis.png)

## 5. Configure prompts and skills

| Option | Purpose | Example |
| --- | --- | --- |
| **System / backend prompt** | Defines the model's role, evidence rules, safety rules, and response format. | `You are an SRE analyst. Separate observations from hypotheses.` |
| **User message template** | Defines the task and injects runtime variables. | `Assess {{panelTitle}} for {{timeRange}} using {{data}}.` |
| **Skills / additional context** | Adds thresholds, runbooks, ownership, and domain definitions. | `p95 latency critical: 1000 ms.` |
| **Constructed prompt preview** | Shows assembled messages before live data is injected. | Read-only preview |

Supported variables:

| Variable | Runtime value |
| --- | --- |
| `{{data}}` | Bounded JSON serialization of every received DataFrame. |
| `{{timeRange}}` | Current dashboard start/end timestamps. |
| `{{panelTitle}}` | Intelligence Gateway panel title. |
| `{{panelId}}` | Numeric Grafana panel ID. |
| `{{skills}}` | Skills/additional context. |
| `{{sourcePanel}}` | Descriptive source-panel hint. |

Treat dashboard field names, labels, values, and logs as untrusted evidence rather than instructions.

## 6. Bound data and behavior

| Option | Purpose | Default |
| --- | --- | --- |
| **Recent rows per frame** | Includes only the newest rows in each frame. | `50` |
| **Maximum context characters** | Hard-caps serialized DataFrame JSON. | `24000` |
| **When no data arrives** | Allows, warns, or blocks analysis without frames. | `Warn` |
| **Analyze automatically** | Runs after data/prompt changes with debounce. | Off |
| **Show Analyze button** | Keeps manual analysis available. | On |
| **Clear analysis** | Cancels an active request and removes response/error state. | Runtime button |

Start with manual analysis. Enable automatic analysis only after provider budgets, prompt behavior, and data limits are understood.

## 7. Verify

1. Select **Load models securely** and confirm only approved models appear.
2. Select **Analyze**.
3. Confirm the Markdown assessment renders.
4. Compare cited fields, values, and timestamps with the source panel.
5. Select **Clear analysis** and confirm only generated state is removed.
6. Save the dashboard.

## Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| No secure data source appears | Companion plugin is missing or no instance exists. | Install it, restart Grafana, configure an instance, and reload the editor. |
| Save & test fails | Endpoint, HTTPS policy, credential, model, or network error. | Correct the data-source configuration; provider details remain server-side. |
| No models load | Provider `/models` failed or no approved model was returned. | Verify data-source health and ensure the default/allowed IDs exist upstream. |
| Requested model is rejected | It is outside the administrator allow-list. | Select an approved ID or ask the administrator to update policy. |
| No visible answer | Reasoning consumed the output ceiling. | Increase both relevant caps or use a non-reasoning model. |
| Request times out | Model generation exceeded a panel or backend deadline. | Reduce context, use a faster model, or align/increase both timeouts within 600 seconds. |
| No source data | Dashboard data source is disconnected or source panel is empty. | Re-select `-- Dashboard --`, choose the source panel, and inspect its active-range data. |

See [Connecting Data from Other Panels](Connecting-Data-from-Other-Panels) for transformations and multi-frame behavior.
