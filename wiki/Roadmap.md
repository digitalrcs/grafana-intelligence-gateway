> Public 1.2.0 candidate documentation; see [Public Edition](Public-Edition) for scope and release status.

# Roadmap

## Near term

- Extend the companion with an OpenAI Responses API adapter and provider-specific generation-parameter negotiation.
- Continue compatibility testing against supported Grafana releases.
- Provider-specific connection diagnostics and administrator usage metrics.
- Broader cancellation, carefully bounded retry policies, and per-provider error guidance.

## Later

- Richer secure streaming with explicit response lifecycle handling.
- Enterprise Copilot Studio delegated identity, approved token lifecycle, and tenant-verified completion contracts. The 1.1.0 Direct Line preview does not implement SSO.
- Raw query-data aggregation from multiple panels through supported Grafana APIs. The public edition supports PNG/JPEG uploads; it does not capture panels or retrieve their raw DataFrames from images.
- Cited findings linked to timestamps/series.
- Saved assessments, comparison over time, quotas, and audit controls.

These are future directions, not commitments or capabilities of public 1.2.0. New provider or identity paths require security review and real-environment validation.
