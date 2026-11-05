# Panel setup and analysis workflow

Public 1.2.1 requires Grafana 11.6 or later and the Intelligence Gateway Secure AI companion 1.1.0 or later; use security-fixed companion 1.1.2 or later. The optional Grafana LLM app has separate requirements.

## Quick start

1. In **Connections → Data sources**, create an **Intelligence Gateway Secure AI** instance. Configure the provider, server-reachable endpoint, credentials if required, approved model and administrator limits. Select **Save & test**.
2. Add an Intelligence Gateway panel. Open **1. Connect AI**, select that instance, and choose an approved model using **Load models securely**.
3. In the **Queries** tab, select **Dashboard → Source panel** to reuse an existing panel’s results. Alternatively, configure this panel’s own queries. This supplies measurements; the Secure AI connection supplies the model.
4. In **3. Analysis task**, choose a preset. Optionally add team definitions, thresholds or runbook instructions under **Skills / additional context**.
5. Return to the panel and select **Analyze**. Review the answer and expand **Evidence** to inspect its inputs. Expand **Ask a follow-up** or **Share assessment** to continue or export.

No AI instance or model is preselected. Configure a real provider before analysis; the Analyze button remains disabled until you select an instance and a model or Copilot agent alias.

## Settings, in order

| Section                            | What to configure                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Connect AI**                  | Setup checklist, Secure AI data source and model. Credentials stay in the companion’s encrypted configuration.                                                      |
| **2. Choose evidence**             | Source label, empty-data behavior, image controls, sample statistics, numeric semantics and optional baseline query IDs. The source label does not connect a query. |
| **3. Analysis task**               | Preset, team context, manual/automatic analysis and debounce. Start with manual analysis.                                                                           |
| **4. Results and sharing**         | Evidence details, follow-ups, assessment title and description. Export controls are available after a successful assessment.                                        |
| **5. Advanced prompts and limits** | System/user prompts, preview, row/character limits, temperature, output budget, requested visible-answer length and timeout.                                        |
| **6. Appearance**                  | Background, text color, font size, padding and alignment.                                                                                                           |

Existing saved prompts and settings are preserved. **Custom instructions** remains the default task. Other presets add instructions to your configured prompts rather than replacing them.

## Choose an analysis task

- **Explain this spike:** identify changes and timestamps, distinguish possible causes from observations, and suggest checks.
- **Compare these series:** compare supplied series and any configured baseline, respecting units and sample coverage.
- **Summarize for handover:** organize observations, supported impact, uncertainty and next checks.
- **Check data quality:** inspect explicit null/invalid values and coverage limitations without inventing missing timestamps.
- **Custom instructions:** use your existing system and user prompts.

You can also change the task using the selector on the panel. Selecting a preset does not immediately submit a manual request. With automatic analysis enabled, task changes can trigger analysis after the debounce.

## Understand the evidence

Each successful assessment keeps a temporary snapshot of its prompt, bounded query evidence, model, time range, source label and submission timestamp. Evidence details show included/omitted row counts. Changes to query data, the dashboard time range or relevant analysis settings mark the answer **out of date**, including changes outside the sampled rows. Failed refreshes retain the previous snapshot.

Row limits include the last rows in the supplied frame order; they do not sort or fetch data. Character limits remove whole oldest rows and recompute statistics, keeping valid JSON. Large metadata can cause entire frames to be omitted. Statistics describe the retained samples, not the full query window. Review the payload under **Submitted query evidence**.

**Numeric metric meaning** applies to every numeric field in the panel:

- **Unknown / raw values:** report raw numeric summaries without assuming a metric’s meaning; no calculated baseline percentages.
- **Gauge / measured values:** sample minimum, maximum, unweighted mean, first/last values and change. Baseline comparisons match unique field names, labels and units.
- **Cumulative counter:** raw minimum/maximum and adjacent observed increases, with decreases treated as resets to zero. No gauge mean or rate is reported. Missing values break adjacency. These are observed sample increments, not a replacement for source-side `rate()`/`increase()` calculations.

For mixed counter/gauge data, calculate rates in the source query or use separate analysis panels. Missing counts identify explicit null/non-finite values in supplied rows; absent timestamps cannot be counted without an expected cadence. Sample means are not time-weighted averages.

## Compare a baseline

1. Configure current query **A** and historical baseline query **B** in Queries, or share a source panel that supplies both reference IDs. Configure the historical period using the data source’s query facilities. This plugin does not retrieve past windows itself.
2. Enable **Compare with a baseline** under **2. Choose evidence**, then enter the exact current and baseline reference IDs.
3. For calculated mean differences and percentage changes, select **Gauge / measured values** and keep **Calculate sample statistics** enabled. Align field names, labels and units between the queries. Duplicate matches are intentionally not compared.
4. Select **Compare these series**, then **Analyze**. Only the two selected query groups are supplied. Missing datasets, identical IDs, or a context limit that removes either dataset block analysis with a setup message.

The dashboard time range and supplied time fields are recorded; query time shifts may make historical timestamps appear aligned to the current window. Describe the actual baseline period in team context. Percent change is unavailable when the baseline mean is zero. Incompatible/ambiguous series can still be reviewed, but have no calculated pair comparison.

## Follow up and share

**Ask about this snapshot** sends the original textual prompt and conversation, even if the dashboard has refreshed. It never silently substitutes new measurements. Up to six follow-ups are allowed; questions are limited to 2,000 characters and prior conversation to 24,000 characters. Oversized conversations are rejected rather than silently truncated. Provider/backend limits still apply. Automatic analysis pauses once a follow-up starts; use **Analyze latest data** to begin a fresh assessment.

Under **Share assessment**, **Copy brief** and **Download brief** create Markdown with the assessment, follow-ups, time range, source, model and dashboard link. Submitted query evidence is excluded by default; explicitly select **Include query evidence in export** to add it. The brief still contains model-generated observations and source metadata, which may themselves be sensitive. Dashboard links use absolute times and omit variable values; reselect variables if needed. Clipboard support depends on browser permissions; downloading is the fallback.

Snapshots and conversations remain in memory, are not saved with the dashboard and are cleared by **Clear analysis**, navigation/unmount or model/provider changes. Clear also cancels active requests. Exports are user-managed files or clipboard contents.

## Images

For images-only analysis, turn off **Include query data with images**. No query is required, even with empty-data behavior set to Block. Open **Images**, add PNG/JPEG files, review the previews, choose **Use images**, then **Analyze images**. Administrator-approved vision support is required. Images are never submitted automatically.

Successful image analysis clears the image files. Follow-ups use the textual assessment and any originally supplied query data; they cannot inspect the images again. Reattach images to request a new visual assessment. Images are not included in exports or saved dashboards. Public-edition dashboard/selected-panel capture, PDF, CSV and office-file uploads are not implemented.

## Advanced settings and troubleshooting

Keep `{{data}}` in a prompt to send query evidence. Other variables are `{{timeRange}}`, `{{panelTitle}}`, `{{panelId}}`, `{{skills}}`, and `{{sourcePanel}}`. The preview substitutes placeholders for live query values. Treat field names, labels, logs and uploaded text as untrusted evidence.

**Maximum output tokens** is a hard request cap, including hidden reasoning on many models. **Requested answer max tokens (soft)** is only a visible-answer length instruction. The provider-default option omits the panel cap but does not bypass administrator/provider limits. Local reasoning models may need both panel and backend caps increased to produce a visible answer. Align panel and backend timeouts; the shortest provider/proxy deadline still wins. Copilot Direct Line owns its generation policy; the optional Grafana LLM app has its own upstream limits. Responses are buffered, not streamed.

| Symptom                    | Check                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| No AI instance/models      | Install the companion, configure an instance, Save & test, and check its approved model list.                             |
| No query data              | Check Queries → Dashboard → Source panel and the active time range. AI connection selection does not supply measurements. |
| Baseline setup error       | Check different reference IDs, nonempty results and sufficient character budget for both datasets.                        |
| No calculated comparison   | Use gauge semantics and statistics; match unique field names, labels and units.                                           |
| Out-of-date assessment     | Select Analyze latest data, or keep asking about the clearly labeled original snapshot.                                   |
| No visible answer          | Check both output caps; reasoning may exhaust the budget before the final answer.                                         |
| Timeout                    | Reduce context or align panel/backend/provider timeouts.                                                                  |
| Images rejected            | Check companion version, enabled vision policy, approved vision model and image limits.                                   |
| Old interface after update | Restart Grafana after replacing the plugin and reload the browser page.                                                   |
