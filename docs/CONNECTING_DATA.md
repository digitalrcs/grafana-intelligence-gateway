# Connecting data from another Grafana panel

Grafana Intelligence Gateway receives data through the same query pipeline as every other panel. The supported way to analyze another panel is Grafana's built-in **Dashboard** data source, which reuses query results from a panel on the same dashboard.

This approach is preferable to reading Grafana's internal dashboard model because it uses a public Grafana feature, avoids a duplicate query to the underlying data source, and supplies normal Grafana DataFrames to the plugin.

## Before you begin

You need:

- A source panel and the Intelligence Gateway panel on the same dashboard.
- At least one working query in the source panel.
- Permission to edit and save the dashboard.
- A dashboard time range that produces data in the source panel.

The source panel can use Prometheus, Loki, SQL, InfluxDB, Elasticsearch, TestData, or another Grafana data source. The Intelligence Gateway does not depend on the source visualization type; it consumes the resulting time-series or table DataFrames.

## Configure the source panel

1. Open the dashboard and select **Edit**.
2. Add or open the panel that contains the data you want assessed.
3. Give it a descriptive title, such as `Server CPU by host`.
4. Configure and run its queries.
5. Confirm the source panel shows the expected time range, series, columns, labels, and values.
6. Save the dashboard.

## Connect the Intelligence Gateway

1. Add a new panel, or edit an existing **Grafana Intelligence Gateway** panel.
2. Open its **Queries** tab.
3. Open the data source picker.
4. Select the special `-- Dashboard --` data source. In newer Grafana versions it may be under the advanced or built-in data source picker.
5. In **Use results from panel**, select the source panel, for example `Server CPU by host`.
6. Choose whether to include the source panel's transformations when Grafana presents that option.
7. Select **Refresh** or **Run queries**. The Intelligence Gateway should no longer show the no-data notice.
8. Under **Data context**, configure:
   - **Recent rows per frame**: number of newest rows included from each DataFrame.
   - **Maximum context characters**: hard request-size cap.
   - **Source panel title or ID (hint)**: optional text added to the prompt; this does not create the connection.
9. Configure the AI provider, prompt, and skills context.
10. Select **Analyze**, then save the dashboard.

## What the plugin sends

For each DataFrame received from the Dashboard data source, the plugin serializes:

- Frame name and query reference ID.
- Field/column names and Grafana field types.
- Series labels, field units, and field descriptions when available.
- The most recent configured number of rows.
- The active dashboard time range.

The serialized block is injected at `{{data}}`. `{{timeRange}}`, `{{panelTitle}}`, `{{panelId}}`, `{{skills}}`, and `{{sourcePanel}}` are available separately.

## Source transformations

Grafana's Dashboard data source can provide source results with or without the source panel's transformations. The exported target commonly contains `withTransforms: true` or `false`.

- Use transformed results when the source panel already reduces, joins, renames, or filters data into exactly the context the AI should see.
- Use untransformed results when the AI needs the original series and labels.
- You can also add transformations directly to the Intelligence Gateway panel to organize fields, limit rows, filter values, join frames, or reduce series before serialization.

Keep AI input small and intentional. A table with the latest exceptions is usually more useful and less expensive than thousands of raw samples.

## Dashboard JSON example

Grafana normally creates this configuration through the UI. The relevant structure resembles:

```json
{
  "datasource": {
    "type": "datasource",
    "uid": "-- Dashboard --"
  },
  "targets": [
    {
      "datasource": {
        "type": "datasource",
        "uid": "-- Dashboard --"
      },
      "panelId": 1,
      "withTransforms": true,
      "refId": "A"
    }
  ],
  "type": "digitalrcs-intelligencegateway-panel"
}
```

`panelId` is the numeric ID of the source panel. Prefer configuring this through Grafana rather than editing dashboard JSON manually.

## Multiple queries and panels

All query results made available by the selected source panel can arrive as multiple DataFrames. The plugin serializes every received frame independently.

Grafana's Dashboard data source selects one source panel per target. If the editor permits multiple targets, you can add more Dashboard targets and select other source panels; verify the combined frames in the query inspector and keep the context cap conservative. For complex multi-panel assessments, a dedicated source panel that joins/reduces the desired data is often clearer.

## Troubleshooting

### The Intelligence Gateway says no data was received

- Confirm the source panel currently displays data for the same dashboard time range.
- Confirm `-- Dashboard --`, not the source panel's original data source, is selected in the Intelligence Gateway.
- Re-select the source under **Use results from panel**.
- Check whether the source query is hidden or disabled.
- Temporarily change the Intelligence Gateway visualization to **Table** to inspect the received rows, then switch it back.
- Open **Query inspector** and inspect the DataFrame response.
- Remove transformations temporarily to identify a filter or join that produces no rows.

### The wrong panel is used

Re-select the source in the UI. If the source panel was deleted and recreated, its numeric panel ID may have changed.

### Repeated rows or tabs use unexpected data

Grafana documents that panels using the Dashboard data source inside repeated rows or tabs can continue to reference the source panel in the original row rather than the repeated copy. Avoid that layout for this workflow or create explicit source panels.

### Data is too large

- Reduce the query time range.
- Aggregate or reduce data in the source query.
- Use Grafana transformations to filter fields and rows.
- Lower **Recent rows per frame**.
- Lower **Maximum context characters**.

### The AI response does not mention a field

Check the prompt preview and query inspector. The field may have been removed by a transformation, excluded because only recent rows are sent, or truncated by the context-character cap.

## Limitations

- The source must be on the same dashboard.
- The source-title/ID hint is prompt metadata only.
- The plugin does not use private runtime APIs to scrape other panels.
- Dashboard data is sent to the selected AI provider; apply your organization's data-handling, retention, and credential policies.

Official Grafana reference: [Share query results with another panel](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/share-query/).
