# Capture implementation provenance

The DOM adapter, capture strategy, progressive dashboard traversal, and image composition in this directory adapt code from DigitalRCS Current View Exporter, licensed under Apache-2.0:

- Repository: https://github.com/digitalrcs/grafana-current-view-exporter
- Source revision: `dfeac69d830cacdf6f262f1e0c3528c10f0bb777`
- Source paths: `src/grafana/GrafanaAdapter.ts`, `src/capture/CaptureEngine.ts`, `src/capture/HtmlCaptureStrategy.ts`, `src/export/DashboardCaptureSession.ts`, and `src/export/DashboardImageComposer.ts`.
- Original copyright: DigitalRCS. The Apache-2.0 license is included at this plugin repository's `LICENSE`.

This adaptation adds exclusion of Intelligence Gateway panels, bounded in-memory image preparation, preview attachments, explicit partial-capture warnings, and the companion data source's vision limits. It is maintained within this plugin and has no runtime dependency on the exporter plugin.

Grafana's alpha screenshot service is feature detected using the installed official `@grafana/runtime` `PanelScreenshotService` interface. Its documented requirement is a visible, materialized panel. Legacy DOM selectors are isolated in `dom.ts`.

The fallback rasterizer bundles `html-to-image` 1.11.13 under its MIT license. The production archive includes its complete copyright and license notice at `licenses/html-to-image-LICENSE.txt`, copied from the locked dependency during the build.
