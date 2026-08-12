# Copilot Studio Status

Copilot Studio is not supported by the production panel/data-source release. Its conversation creation, token exchange, polling, and activity contracts differ from OpenAI-compatible chat completions and require a dedicated server-side adapter.

No Copilot endpoint or bearer token can be stored in panel options. A future implementation must live in the secure data-source backend, keep tokens in `secureJsonData`, validate origins and conversation identifiers, bound polling or streaming, sanitize errors, and add deterministic integration tests before it is advertised as supported.
