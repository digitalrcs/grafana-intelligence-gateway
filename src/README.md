# Grafana Intelligence Gateway

AI-assisted assessment panel for Grafana DataFrames. Configure the required Intelligence Gateway Secure AI data source, connect query results, and select **Analyze**.

For another panel's data, use Grafana's built-in **Dashboard** data source. The panel reads only its own official `data.series` input.

Use cases include comparing traffic across sites, drafting incident handovers, and suggesting checks from supplied metrics and operational context. The [Reviewer Walkthrough](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough) demonstrates a synthetic traffic shift and real-provider setup. The default Docker mock only verifies connectivity; it does not perform AI inference. All generated assessments require human verification.

## Important security note

This panel never accepts or stores provider credentials. All provider traffic uses the required `digitalrcs-intelligencegateway-datasource`, which owns `secureJsonData` and server-side policy.

Do not return secrets through a JSON/CSV data source query: query results are browser-visible DataFrames. See the repository Wiki's Secure Backend and Secret Storage page for the companion data-source contract.

Full documentation: <https://github.com/DigitalRCS/grafana-intelligence-gateway>
