# Grafana Intelligence Gateway

Bring AI analysis to your Grafana data and dashboard images.

Grafana Intelligence Gateway by **DigitalRCS** connects your dashboard to local AI or hosted frontier models through the required **Intelligence Gateway Secure AI** data source. Ask questions about query results, dashboard captures, or uploaded images and display the model's assessment alongside your charts, without copying evidence into a separate chat application.

Choose **OpenAI**, **LM Studio**, **Open WebUI**, the optional **Grafana LLM app**, a **custom OpenAI-compatible Chat Completions endpoint**, or **Copilot Studio Direct Line (preview)** in the companion data source. Model and image capabilities depend on the configured provider.

Version **1.1.0** adds whole-dashboard capture, selected-panel capture, and multiple PNG/JPEG uploads. Images require an administrator-approved vision model, a preview, and an explicit **Analyze images** action. Copilot's Direct Line adapter is a preview, not corporate SSO or delegated Entra integration. See the [image workflow](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Image-Analysis) and [Copilot setup and authentication](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Copilot-Studio-Notes).

![A Grafana chart showing traffic shifting between two data centers, with a local LM Studio model's assessment below it](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/src/img/panel-analysis.png)

_Example: a local LM Studio model explains a traffic shift in synthetic demonstration data, identifies gaps in the evidence, and suggests follow-up checks._

## Turn panel data into operational context

- **Explain changes in metrics.** Ask the model to summarize trends, spikes, drops, and differences between series.
- **Compare sites or services.** Examine activity across data centers, applications, or environments using the query results already in your dashboard.
- **Summarize an incident window.** Combine the selected time range with your team's definitions, thresholds, and runbooks.
- **Prepare a handover.** Request a concise account of observations, uncertainty, and next checks for another operator.
- **Review visual evidence.** Ask a vision model to assess selected charts or approved diagrams, with or without query rows.

For example: “Compare DC1 and DC2 over this time range. Describe the traffic shift, distinguish observations from possible causes, and suggest three checks.”

## Use the data from an existing panel

The panel analyzes time-series and table query results. It can run its own Grafana queries or reuse another panel's results through Grafana's built-in **Dashboard** data source. Images are optional: capturing a chart adds its rendered appearance, not its underlying query results.

| Assessment          | Setup                                                                                                                                 | Action                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Data only**       | Connect queries or select a Dashboard source panel. Leave images unattached.                                                          | **Analyze**                             |
| **Images only**     | No query results are required. Turn off **Include query data with images**, then capture panels or add files and review the previews. | **Use images**, then **Analyze images** |
| **Data and images** | Connect the query data and leave **Include query data with images** on. Capture or add images and review the previews.                | **Use images**, then **Analyze images** |

Two connections serve different purposes:

| Connection                              | What it provides                               |
| --------------------------------------- | ---------------------------------------------- |
| **Queries → Dashboard → Source panel**  | The existing panel's query results to analyze. |
| **AI provider → Secure AI data source** | The connection to your local or hosted model.  |

Field names, labels, units, recent rows, and the active time range give the model context for its answer. Use Grafana transformations and the panel's row and character limits to control the input.

## Get started

Requires **Grafana 11.6 or later** and [Intelligence Gateway Secure AI data source **1.1.0 or later**](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource). Install the companion before panel 1.1.0. The optional Grafana LLM app has its own requirements; the documented app 1.2.0 integration requires Grafana 13 or later. The Current View Exporter plugin is not required.

1. **Configure the AI connection.** Create a Secure AI data-source instance with your provider endpoint, credentials when required, and an allowed model. The endpoint must be reachable from the Grafana server.
2. **Choose the evidence.** Add a Grafana Intelligence Gateway panel. For data-only or combined analysis, select **Queries → Dashboard** and a source panel returning data for the selected time range. For images-only analysis, query results are optional.
3. **Choose the model.** Under **AI provider**, select the Secure AI data source, then use **Load models securely** to choose an available, administrator-approved model.
4. **Set the analysis task.** Add your question to the user message template. For data-only or combined assessment, keep `{{data}}` to include query results; for images-only, ask about the attached evidence. Use `{{skills}}` to include definitions or runbook guidance from **Skills / additional context**.
5. **Run the assessment.** Select **Analyze** for query data. For images, open **Images**, capture or add files, inspect every preview, choose **Use images**, and select **Analyze images**. Use **Clear analysis** to clear the answer and pending images without changing the source data.

The [illustrated setup guide](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Panel-Setup-and-Configuration) explains every setting. See [Connecting Data from Other Panels](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Connecting-Data-from-Other-Panels) for query sharing and transformations.

## Shape the analysis

Customize system instructions, the user message template, and reusable context. Prompt variables can include the panel title, time range, source-panel label, and query data.

Run data analysis manually or enable automatic analysis when data and prompts change. Images are never submitted automatically. Adjust input size, output-token limits, response timeout, and the requested answer length. A reasoning model may spend its output budget before producing a visible answer; increase both the panel cap and administrator ceiling where appropriate, rather than only the requested answer length. Administrator and provider limits still apply, including when the panel uses the provider/model default output limit.

Responses appear as formatted Markdown. **Refresh assessment** reruns the current assessment; after a successful image assessment, capture or attach images again to include them in a new request. **Clear analysis** removes the response and pending images and cancels an active request. The image preview also supports removing individual images or all staged images.

## Choose where your data is processed

The companion data source sends the selected query data, prompts, additional context, and explicitly submitted images to the provider you configure. A local endpoint supports processing within your own environment; a hosted endpoint sends that content to the chosen provider. Review screenshots for confidential information before sending. Pending images stay in memory, are cleared after a successful image assessment, and are never saved with the dashboard.

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
