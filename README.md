# Grafana Intelligence Gateway

Bring AI analysis to the data behind your Grafana panels.

Grafana Intelligence Gateway by **DigitalRCS** connects your dashboard to local AI or hosted frontier models through the required **Intelligence Gateway Secure AI** data source. Ask questions about a panel's query results and display the model's assessment alongside your charts, without copying data into a separate chat application.

Run local models with **LM Studio**, connect to hosted models from **OpenAI**, or use another provider offering an **OpenAI-compatible Chat Completions API**. Choose the model and deployment that fit your team's needs.

![A Grafana chart showing traffic shifting between two data centers, with a local LM Studio model's assessment below it](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/src/img/panel-analysis.png)

_Example: a local LM Studio model explains a traffic shift in synthetic demonstration data, identifies gaps in the evidence, and suggests follow-up checks._

## Turn panel data into operational context

- **Explain changes in metrics.** Ask the model to summarize trends, spikes, drops, and differences between series.
- **Compare sites or services.** Examine activity across data centers, applications, or environments using the query results already in your dashboard.
- **Summarize an incident window.** Combine the selected time range with your team's definitions, thresholds, and runbooks.
- **Prepare a handover.** Request a concise account of observations, uncertainty, and next checks for another operator.

For example: “Compare DC1 and DC2 over this time range. Describe the traffic shift, distinguish observations from possible causes, and suggest three checks.”

## Use the data from an existing panel

The panel analyzes time-series and table query results. It can run its own Grafana queries or reuse another panel's results through Grafana's built-in **Dashboard** data source. The model receives the selected data and configured context; it does not read a screenshot of the chart.

Two connections serve different purposes:

| Connection                              | What it provides                               |
| --------------------------------------- | ---------------------------------------------- |
| **Queries → Dashboard → Source panel**  | The existing panel's query results to analyze. |
| **AI provider → Secure AI data source** | The connection to your local or hosted model.  |

Field names, labels, units, recent rows, and the active time range give the model context for its answer. Use Grafana transformations and the panel's row and character limits to control the input.

## Get started

Requires **Grafana 11.6 or later**, the **Grafana Intelligence Gateway** panel, and the companion [Intelligence Gateway Secure AI data source](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource).

1. **Configure the AI connection.** Create a Secure AI data-source instance with your provider endpoint, credentials when required, and an allowed model. The endpoint must be reachable from the Grafana server.
2. **Connect your panel data.** Add a Grafana Intelligence Gateway panel. In **Queries**, select **Dashboard** and choose a source panel on the same dashboard. Confirm that it returns data for the selected time range.
3. **Choose the model.** Under **AI provider**, select the Secure AI data source, then use **Load models securely** to choose an available, administrator-approved model.
4. **Set the analysis task.** Add your question to the default user message template, keeping `{{data}}` and `{{skills}}` so query results and additional context are included. Add definitions or runbook guidance under **Skills / additional context**.
5. **Select Analyze.** Read the response in the panel, use **Refresh assessment** to run it again, or **Clear analysis** to remove the answer without changing the source data.

The [illustrated setup guide](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Panel-Setup-and-Configuration) explains every setting. See [Connecting Data from Other Panels](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Connecting-Data-from-Other-Panels) for query sharing and transformations.

## Shape the analysis

Customize system instructions, the user message template, and reusable context. Prompt variables can include the panel title, time range, source-panel label, and query data.

Run analysis manually or enable automatic analysis when data and prompts change. Adjust input size, output-token limits, response timeout, and the requested answer length. Administrator and provider limits still apply. Responses appear as formatted Markdown. **Refresh assessment** reruns the analysis; **Clear analysis** removes the response and cancels an active request.

## Choose where your data is processed

The companion data source sends the selected query data, prompts, and additional context to the provider you configure. A local endpoint supports processing within your own environment; a hosted endpoint sends that content to the chosen provider.

Provider credentials are stored in Grafana's encrypted data-source configuration and used by the backend. They are not stored in panel options or dashboard JSON. Administrators control the permitted endpoint and models, along with request limits.

Assessments depend on the model, prompt, and supplied data. Review findings against the source measurements before acting. Answers are temporary panel state and are not saved with the dashboard.

## Documentation and support

- [User documentation](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki)
- [Secure AI connection and credential storage](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Secure-Backend-and-Secrets)
- [Report an issue](https://github.com/digitalrcs/grafana-intelligence-gateway/issues)
- [Development and local setup](docs/DEVELOPMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Apache 2.0 license](https://github.com/digitalrcs/grafana-intelligence-gateway/blob/main/LICENSE)

Developed by [DigitalRCS](https://digitalrcs.com).

<a href="https://digitalrcs.com"><img src="https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/docs/images/digitalrcs-logo.webp" alt="DigitalRCS — Solutions that connect. Inside and out." width="240" /></a>
