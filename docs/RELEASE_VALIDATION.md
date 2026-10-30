# 1.1.0 release validation

This record separates local preflight, GitHub CI, the exact released archive, and Grafana's own approval. The [submission handoff](GRAFANA_SUBMISSION.md) contains the version-matched fields. No catalog approval or public signature is implied.

## 1.1.1 signing-release assessment — October 30, 2026

The fresh full npm audit reports **five moderate and seven low affected package entries, zero high, and zero critical**. The production-only audit reports the same **four moderate React Router package entries** described below. The additional moderate `qs` finding is in the development-only `tiny-lr` chain; the low `deepmerge` finding is in development test/type-check tooling. These development tools are not shipped as plugin runtime implementations. The October 26 totals below are historical and must not be presented as today's full-audit count.

The signing release keeps the reviewed 1.1.0 plugin functionality and runtime dependencies unchanged. The development-only Grafana E2E helper is updated to 3.15.4 for current host compatibility. The test harness waits for either supported same-origin core OFREP route before navigating, and checks the installed companion's metadata when classifying its exact missing catalog-version lookup; it does not assume the panel and companion versions are equal. Console checks remain strict. The release workflow requires the signing credential before building, checks the checksum and signed manifest in the exact archive, and then runs the provenance and full-validator release gates. This preparation does not establish a successful signed release; inspect the generated manifest and final workflow evidence.

## Dependency assessment — October 26, 2026

Both repositories now pin the development signing tool's `get-uri > basic-ftp` dependency to 6.2.1 and the host-external `@grafana/data > moment` dependency to 2.31.0. This removes the current high-severity FTP directory-list parser advisory and the Moment findings without adopting sign-plugin 4 (which requires a newer Node runtime). The narrow FTP override retains the Client API used by get-uri; the signing-tool dependency import is smoke-tested. No forced broad audit fix is used.

The full npm audit reports **four moderate affected package entries, zero high, and zero critical**. The remaining React Router compatibility chain represents two advisories:

- [GHSA-wrjc-x8rr-h8h6](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6): external redirects from untrusted navigation paths.
- [GHSA-337j-9hxr-rhxg](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg): SSR error-hydration constructor injection.

The plugin does not import routing APIs or implement SSR hydration. Grafana and React are host-provided externals, not bundled router implementations. This is an archive-scope assessment, not a guarantee about Grafana hosts; administrators must keep Grafana patched. CI checks the full dependency graph at high severity and above, including development tools. The remaining findings are not suppressed.

Other narrow lockfile updates include DOMPurify, zod, fast-uri, source-map-js, ip-address, postcss-selector-parser, and serialize-javascript. No model/provider credentials are required for the checks.

## Preflight and scope

The feature includes tests for input bounds, explicit preview/send behavior, image-only versus combined requests, image-model approval, invalid image data, capture naming, and desktop/narrow checkbox layout. The secure companion also tests Direct Line protocol handling, JSON-only responses, fail-fast concurrency, and response-body slot ownership.

The build entry is explicitly src/module.ts; archived evidence cannot become additional webpack entry points. The capture adapter uses feature detection with a bounded DOM fallback and records its exporter attribution in src/vision/PROVENANCE.md.

Local build/unit checks are complemented by CI on released Grafana versions. Read the [Actions results](https://github.com/digitalrcs/grafana-intelligence-gateway/actions) for the exact release commit and tested matrix; do not infer a minimum-version test from plugin metadata. Native Windows uses Node 26; plugin-e2e 3.15.4 supports Node 20 or newer. CI uses Node 22 and is the clean-install browser gate.

The isolated Grafana 13.1.1 review environment previously verified capture/preview, explicit send, clear/remove, data-only inference, and checkbox wrapping at desktop and narrow widths. The current user's live LM Studio instance is not used for automatic mock tests or overwritten during release preparation. CI uses only synthetic data and the deterministic mock.

## Real-provider limitations

A real LM Studio text-only assessment of synthetic traffic completed in the local test environment after increasing the output budget. That does not prove image understanding. Mock vision tests verify transport/policy/UI, not real inference quality. Live image-understanding tests for all providers, Grafana LLM app deployments, and Copilot Studio tenants are not claimed. Copilot remains a bounded Direct Line preview, without delegated enterprise SSO.

Capture uses rendered dashboard content. Lazy panel loading or scheduled dashboard refresh may still query data; no universal zero-query guarantee is made. Review previews for omitted panels and sensitive content.

## Exact release archive gate

The default Docker review image uses production application mode and a specific unsigned-plugin allow-list. It omits the scaffold's unconditional `localhost:35729/livereload.js` injection, which caused unrelated connection-refused errors in browser validation. Console checks remain strict. The images-only regression measures action-triggered queries after Grafana completes initial dashboard setup; Grafana may initialize a default data source even when no source query is configured. Its output is excluded from the images-only request.

The tagged Release workflow downloads its generated ZIP and SHA1 asset, verifies their agreement, verifies GitHub provenance against the repository, release workflow and exact tag commit, then runs the full default Grafana Plugin Validator Docker image with the matching source tag. It preserves the validator image digest and results as the `release-validation` Actions artifact.

The integrated review image disables only the unrelated, unconfigured `grafana-assistant-app`. Its background service requests returned HTTP 503 in the standalone Grafana 13.2.4 fixture while Grafana's core feature-flag endpoint returned HTTP 200. This environment correction avoids hiding those errors in the test harness; it does not disable the optional `grafana-llm-app` provider or change production hosts.

Browser evidence separately records Grafana's documented missing public-sharing configuration and per-user saved-query configuration probes. Only same-origin GET 404 responses on those exact routes with the expected structured absence body are classified as known diagnostics. Unexpected bodies, other routes, plugin resource failures, HTTP 503s, and uncaught page errors still fail the check; a regression test covers this boundary.

Before publishing/submitting, inspect that evidence for packaging, source, security, dependency, provenance, and signature findings. An expected unsigned-review warning is not permission to overlook other failures. AI-assisted validator reviews require a separately configured provider and are not represented as performed without one.

The 1.1.0 archives were unsigned review builds requiring an explicit plugin allow-list. Following Grafana's review, the 1.1.1 release workflow requires a signing credential and a signed manifest in the exact downloaded archive. Inspect that release's manifest and validation evidence for its actual signature status. Provenance and a Grafana signature are independent.

Verify public download/checksum and asset contents again after publication. Record the exact public asset hashes in the submission handoff rather than guessing them before the release is built. GitHub Wiki publication is a separate repository push; committing `wiki/` alone is insufficient.
