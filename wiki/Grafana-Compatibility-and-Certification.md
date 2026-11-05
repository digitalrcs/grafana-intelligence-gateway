> Public 1.2.0 candidate documentation; not a release or catalog approval. See [Public Edition](Public-Edition).

# Public 1.2.0 readiness and submission handoff

Status: candidate, not released or submitted. Do not enter historical 1.1.2 archive values for this candidate.

The public project is https://github.com/digitalrcs/grafana-intelligence-gateway; the shared companion is https://github.com/digitalrcs/grafana-intelligence-gateway-datasource. Retain plugin ID `digitalrcs-intelligencegateway-panel` for dashboard compatibility. A separate workspace/repository does not create a new catalog identity. Confirm the existing listing with the organization administrator; normally this is Submit Update. A genuinely new plugin identity requires a deliberate migration and Grafana agreement, not just a repository rename.

## Required gates

1. Review the public source, history, documentation and image assets for secrets and private-only additions. Historical public capture code remains public history; removing it from the current tree does not retract old releases.
2. Pass clean dependency installation, edition guard, typecheck, lint, unit tests, production build and dependency audit. Run the upload/data browser suite across supported Grafana versions with the pinned secure companion. Mock receipts establish transport only; separately validate a real approved vision provider with synthetic evidence.
3. Confirm public signing authorization and organization ownership. Public Community/Commercial classification is Grafana's decision; free source alone does not establish Community eligibility. Organization-admin access is required for submission. Do not expose signing credentials to pull-request builds.
4. Prepare an immutable source tag and a ZIP rooted at the plugin ID. Verify license, catalog README, metadata, screenshots, module and signature as applicable. Run the full official plugin validator against that exact ZIP and source revision; resolve warnings or document reviewer disposition.
5. Verify exact public-download SHA1/SHA256, manifest signature and GitHub provenance. Record artifact URL, immutable source URL, literal 40-character SHA1, test guidance and all validation evidence below.
6. Only after these gates and necessary account approvals, use the appropriate portal submission action. This document authorizes no automatic portal submission.

## Candidate submission values

Version: 1.2.0. ZIP URL, immutable source URL and SHA1: **not established**. Do not substitute a source ZIP, a checksum-file URL or historical values. Signing, provenance, catalog approval and certification are distinct states.

## Reviewer scenario

Install the companion first (use security-fixed 1.1.2 or later). Start the isolated loopback-only port-3005 fixture with synthetic TestData and the labeled deterministic mock. Connect Queries → Dashboard → Source panel for existing results. Choose the secure AI instance separately. Verify Analyze for data, PNG/JPEG preview without inference, explicit Analyze images, images-only with query inclusion disabled, combined mode, removal, clear/cancellation, model-policy rejection and absence of dashboard/selected-panel capture controls. Do not run the full mock-oriented suite against a real provider.

## Official requirements checked 2026-11-05

- [Publishing and review](https://grafana.com/developers/plugin-tools/publish-a-plugin/publish-a-plugin)
- [Signing](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)
- [Plugin policy and signature classifications](https://grafana.com/legal/plugins/)
- [Packaging](https://grafana.com/developers/plugin-tools/publish-a-plugin/package-a-plugin)

Initial review may accept unsigned artifacts; public signing requires Grafana's signature grant. This existing project's release workflow intentionally requires signing. The installed sign-plugin 3.x is distinct from current 4.x, which requires Node 24.15 or later; do not upgrade it without updating the toolchain and validating the migration.

Local candidate validation on 2026-11-05 completed against immutable source c436fec: the official validator reported only the expected unsigned warning after the React scanner cache was warmed. This does not replace validation of the final signed release.
