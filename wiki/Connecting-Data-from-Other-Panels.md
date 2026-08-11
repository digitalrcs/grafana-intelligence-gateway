# Connecting Data from Other Panels

Grafana Intelligence Gateway consumes normal Grafana DataFrames. To assess another panel, use Grafana's built-in `-- Dashboard --` data source to reuse the other panel's query results on the same dashboard.

## Quick setup

1. Confirm the source panel has a working query and a clear title.
2. Edit the Intelligence Gateway panel and open **Queries**.
3. Select `-- Dashboard --` from the data source picker.
4. Under **Use results from panel**, select the source panel.
5. Choose whether to include the source panel's transformations.
6. Run the query and confirm the no-data notice disappears.
7. Set **Recent rows per frame** and **Maximum context characters**.
8. Select **Analyze** and save the dashboard.

The **Source panel title or ID (hint)** is prompt metadata only. It does not fetch anything.

## What is included

The plugin serializes every received frame with its name, query reference ID, field names/types, labels, units, descriptions, recent rows, and the dashboard time range. It injects this block through `{{data}}`.

## Transformations

Use transformed source results when the source panel already filters, joins, renames, or reduces data into the desired assessment context. Use original results when the model needs the full series structure. Transformations can also be added to the Intelligence Gateway panel.

## Troubleshooting

- Verify the source panel has data for the active time range.
- Re-select `-- Dashboard --` and the source panel.
- Use **Query inspector** to inspect the received DataFrames.
- Temporarily use a Table visualization to verify rows and columns.
- Reduce or disable transformations that produce an empty result.
- Re-select a source panel that was deleted/recreated because its numeric ID may have changed.

Repeated rows and tabs can reference the source in the original row rather than the repeated copy. Prefer explicit, non-repeated source panels for AI assessment.

See the complete repository guide: [`docs/CONNECTING_DATA.md`](../docs/CONNECTING_DATA.md).
