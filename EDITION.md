# Public edition — 1.2.0

This is the public catalog candidate. The private edition is maintained in a separate local workspace and is never used as this repository's publication source.

- Standard query-data analysis, provider selection, prompts, skills and limits remain.
- PNG/JPEG file upload, preview, removal and explicit image analysis remain.
- Dashboard and selected-panel capture and the html-to-image dependency are removed from source, not hidden by settings.
- Use Queries → Dashboard → Source panel to share an existing panel's results in the same dashboard. Do not duplicate its query to analyze already-loaded results. Grafana still controls initial loads and scheduled refreshes.
- Upload processing uses a detached canvas for resizing; it does not inspect dashboard DOM or invoke a rendering server.
- Both editions preserve the existing plugin ID for dashboard compatibility; install only one edition in a Grafana instance. Restart Grafana after replacement. No automatic dashboard migration is needed.
- File means PNG/JPEG here; PDF, CSV and office-document uploads are not implemented.

## Development and release

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:ci`, and `npm run build`.
The prebuild guard rejects the known cross-panel capture implementation. It is a regression guard, not proof of Grafana approval.
The public Git remote is the existing public repository. This 1.2.0 candidate is subject to the readiness gates in docs/GRAFANA_SUBMISSION.md; no release or catalog approval is implied.
The companion secure AI data source remains shared and does not need a separate edition. Set INTELLIGENCE_GATEWAY_DATASOURCE_DIST when testing against its existing build.
Run browser tests against the public build before release. Historical release notes and evidence describe earlier releases, not this edition.

See VALIDATION.md for verified checks and pending browser/signing work.
