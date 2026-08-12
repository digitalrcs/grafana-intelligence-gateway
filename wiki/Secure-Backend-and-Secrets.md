# Secure Backend and Secret Storage

## Current support and the security boundary

Grafana Intelligence Gateway is currently a **panel plugin**. Grafana's plugin guidance is explicit that panel plugins cannot securely store credentials. The masked API-key field is convenient for local development, but its value is part of dashboard JSON.

Do not put a production key in panel options, `jsonData`, a JSON/CSV query result, a dashboard variable, or a field returned by another data source. Anything delivered to the panel runs in the browser and can be inspected by a dashboard user.

Grafana encrypts data-source `secureJsonData` on the server. After a data source is saved, the browser receives only a `secureJsonFields` flag indicating that a secret exists; it does not receive the value. The saved secret can be applied by Grafana's data source proxy or read by that data source's backend component.

Official references:

- [Grafana plugin authentication and secureJsonData](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins)
- [Grafana plugin security best practices](https://grafana.com/developers/plugin-tools/key-concepts/best-practices)
- [Grafana backend plugin resources](https://grafana.com/developers/plugin-tools/key-concepts/backend-plugins)

## Supported choices in this release

| Choice | Where the credential lives | Production safe? | Use case |
| --- | --- | --- | --- |
| Direct browser connection | Panel option/dashboard JSON | No | Local LM Studio or a restricted temporary development key |
| OpenAI-compatible gateway with no browser credential | The external gateway's server-side secret store | Yes, if the gateway is correctly secured | Existing organization proxy, API gateway, or local reverse proxy |
| Grafana `secureJsonData` | A separate data source or app plugin instance | Yes | Planned DigitalRCS companion data source |
| JSON/CSV data-source query result | Browser-visible DataFrame | No | Never use for secrets |

An existing OpenAI-compatible gateway can be used today by choosing **Custom / OpenAI-compatible**, entering its `/v1` base URL, and leaving **API key** blank. The gateway must authenticate the Grafana user or network independently and must not require a long-lived secret in the panel.

## Why the panel cannot read another data source's secret

`secureJsonData` belongs to a specific data-source or app-plugin instance. Grafana intentionally does not expose the decrypted object to browser code, including this panel. Querying another data source returns ordinary DataFrames; returning the key in a frame would turn it back into browser-visible data and defeat the protection.

The safe design is a companion data source. The panel sends the prompt and bounded Grafana data to that data source. Grafana handles the request server-side, applies the stored credential, calls only an administrator-configured provider host, and returns the model's answer—not the secret—to the panel.

## Companion data-source configuration contract

The following is the proposed configuration contract for `digitalrcs-intelligencegateway-datasource`. It documents the boundary needed for implementation; the companion data source is **not included in the current panel release**, so the panel does not yet show a secure-data-source selector.

### Non-secret `jsonData`

```json
{
  "provider": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "defaultModel": "gpt-4.1-mini",
  "timeoutSeconds": 300,
  "allowedModels": ["gpt-4.1-mini", "gpt-4.1"],
  "maxOutputTokens": 256000,
  "allowStreaming": false
}
```

| Property | Type | Purpose |
| --- | --- | --- |
| `provider` | string | Provider adapter, initially `openai`, `lmstudio`, or `custom`. |
| `baseUrl` | URL string | Administrator-controlled provider base URL. The backend must validate and allow-list it to prevent SSRF. |
| `defaultModel` | string | Default model when the panel does not request one. |
| `timeoutSeconds` | integer | Server-side request deadline. |
| `allowedModels` | string array | Optional allow-list of model IDs a panel may request. |
| `maxOutputTokens` | integer | Administrator ceiling; the panel may request a lower cap but not a higher one. |
| `allowStreaming` | boolean | Whether the backend permits streamed provider responses. |

Do not place keys, passwords, bearer tokens, client secrets, or private headers in `jsonData`. Grafana users who can access the data source can inspect this object.

### Secret `secureJsonData`

```json
{
  "apiKey": "provider-key-written-only-during-save",
  "bearerToken": "optional-provider-token",
  "clientSecret": "optional-oauth-client-secret"
}
```

Only fields required by the selected authentication method should be stored. The configuration editor writes these values once and later displays only configured/reset state using `secureJsonFields`.

### Provisioning YAML

Environment-variable expansion keeps the key out of the committed file:

```yaml
apiVersion: 1

datasources:
  - name: Intelligence Gateway Secure AI
    uid: intelligence-gateway-secure
    type: digitalrcs-intelligencegateway-datasource
    access: proxy
    jsonData:
      provider: openai
      baseUrl: https://api.openai.com/v1
      defaultModel: gpt-4.1-mini
      timeoutSeconds: 300
      allowedModels:
        - gpt-4.1-mini
      maxOutputTokens: 256000
      allowStreaming: false
    secureJsonData:
      apiKey: ${OPENAI_API_KEY}
```

Set `OPENAI_API_KEY` in the Grafana server/container secret environment, not in the dashboard or source repository. Restrict who can edit and query the data source.

## Expected request flow

1. The administrator configures the companion data source and saves its secret.
2. The panel stores only the data-source UID and non-secret generation choices.
3. The panel sends the constructed prompt, requested model, temperature, and output cap to the data source.
4. Grafana resolves the data-source instance server-side.
5. The proxy/backend enforces host, model, token, timeout, and payload policies and adds the decrypted credential.
6. The provider answer and sanitized error metadata return to the panel. The credential never does.

The companion should also redact provider errors, avoid logging prompts or keys by default, cap request bodies, enforce TLS for remote hosts, reject redirects to unapproved hosts, and apply rate/cost limits.

## Token controls with a secure backend

The panel's **Maximum output tokens** remains a request cap. The companion's `maxOutputTokens` is an administrator ceiling, so the effective hard cap is the lower of the two. Enabling **Provider/model default output limit** omits the panel cap, but the administrator ceiling and provider limits still apply. **Requested answer max tokens (soft)** is only a prompt instruction and cannot guarantee an exact token count.
