# Configuration (AI Providers)

Choose OpenAI, LM Studio, Custom/OpenAI-compatible, or experimental Copilot Studio. Configure endpoint, model, credentials, temperature, output-token cap, and optional streaming.

**Maximum output tokens** is a hard request cap with a 64–1,048,576 slider range. **Provider/model default output limit** omits the `max_tokens` field; it removes the panel cap but is not truly unlimited. **Requested answer max tokens (soft)** adds a concision instruction to the system message, and the model may only approximate it.

LM Studio also provides a reasoning-effort control. Reasoning tokens share the configured output-token budget, so a reasoning model can reach the limit before it emits a visible answer. The panel defaults LM Studio reasoning to **None**, reports this condition explicitly, and applies a configurable response timeout (300 seconds by default).

OpenAI-compatible base URLs should end at `/v1`; the panel appends `/chat/completions`. Streaming uses browser `fetch` and SSE. Buffered requests use Grafana's frontend request service. Both require the remote server to allow the Grafana browser origin unless a backend proxy is introduced.

Panel option credentials are not secure storage. See [Security Considerations](Security-Considerations).

For the safe server-side credential design and exact `jsonData`/`secureJsonData` schemas, see [Secure Backend and Secret Storage](Secure-Backend-and-Secrets).
