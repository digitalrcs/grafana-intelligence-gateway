# Intelligence Gateway public 1.2.1

Includes the real-backend setup, clearer interface, numerical reliability fixes and assessment workflows described in [1.2.0 changes](RELEASE_NOTES_1.2.0.md).

Uses Grafana locationService and the base-URL helper for exported dashboard links and navigation identity, resolving the Plugin Validator warning found in the retained 1.2.0 draft. The release workflow now uses strict validation so warnings fail verification. Use 1.2.1 for installation.

See [release verification](GRAFANA_SUBMISSION.md) for final artifact values and catalog status.

[Download the signed release](https://github.com/digitalrcs/grafana-intelligence-gateway/releases/tag/v1.2.1). The mock provider/default connection are removed. Freshness fingerprints distinguish adjacent values, and counter increases/reset counts are null without valid adjacent sample pairs.
