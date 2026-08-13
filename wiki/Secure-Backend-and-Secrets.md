# Secure Backend and Secret Storage

## Recommended production architecture

DigitalRCS provides the companion [`digitalrcs-intelligencegateway-datasource`](https://github.com/DigitalRCS/grafana-intelligence-gateway-datasource). Install it beside the panel, create an **Intelligence Gateway Secure AI** data-source instance, store the provider credential in Grafana `secureJsonData`, and select that instance under **AI provider > Secure AI data source**.

The data source has its own [installation and operations wiki](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki), including a credential-free reviewer environment and troubleshooting.

![Secure data-source selection](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway-datasource/main/src/img/panel-secure-datasource.png)

The panel stores only the data-source UID, requested model, temperature, and output cap. Grafana resolves the instance server-side; the companion backend decrypts the credential, enforces administrator policy, calls the provider, and returns only the answer or sanitized error metadata.

The panel has no direct browser credential or provider-URL mode. The companion data source is declared as a required plugin dependency and is the only provider transport.

Official references:

- [Grafana plugin authentication and secureJsonData](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins)
- [Grafana backend resource handlers](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-resource-handler)
- [Grafana plugin security best practices](https://grafana.com/developers/plugin-tools/key-concepts/best-practices)

## Install and configure

1. Install both plugin directories in Grafana's plugin directory.
2. Restart Grafana after installation or a `plugin.json` change.
3. Open **Connections > Data sources > Add new data source**.
4. Select **Intelligence Gateway Secure AI**.
5. Configure the provider URL, default model, allowed models, timeout, administrator token ceiling, and streaming policy.
6. Enter only the credential required by the provider and select **Save & test**.
7. Edit the Intelligence Gateway panel and select the saved instance under **Secure AI data source**.
8. Enter or securely load an administrator-allowed model, then select **Analyze**.

## Configuration contract

Non-secret `jsonData`:

```json
{
  "provider": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "defaultModel": "gpt-4.1-mini",
  "timeoutSeconds": 300,
  "allowedModels": ["gpt-4.1-mini", "gpt-4.1"],
  "maxOutputTokens": 256000,
  "allowInsecureHttp": false
}
```

| Property            | Purpose                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`          | `openai`, `lmstudio`, or `custom` provider policy.                                                                                                  |
| `baseUrl`           | Administrator-controlled provider base URL. Resource requests cannot replace it.                                                                    |
| `defaultModel`      | Model used when a request does not override it.                                                                                                     |
| `timeoutSeconds`    | Server-side provider deadline, from 1 to 600 seconds.                                                                                               |
| `allowedModels`     | Administrator allow-list for panel-requested model IDs. The default model must be included; when empty, only the default model is permitted.       |
| `maxOutputTokens`   | Administrator ceiling applied even when the panel omits its cap.                                                                                    |
| `allowInsecureHttp` | Explicit administrator override for HTTP provider URLs when organizational DNS/address locality cannot be classified reliably. Defaults to `false`. |

Secret `secureJsonData`:

```json
{
  "apiKey": "provider-key-written-only-during-save",
  "bearerToken": "optional-provider-token"
}
```

The browser later receives configured/reset flags through `secureJsonFields`, never the decrypted values. Configure only one credential; a bearer token takes precedence over an API key.

## Provisioning

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
      allowInsecureHttp: false
    secureJsonData:
      apiKey: ${OPENAI_API_KEY}
```

Set `OPENAI_API_KEY` in the Grafana server/container secret environment. Never commit it in provisioning, a dashboard, or the source repository. Use Grafana data-source permissions to restrict who may edit and query the instance.

## Enforced backend policy

- Fixed `/models` and `/chat/completions` upstream paths; panel requests cannot choose an arbitrary host or path.
- HTTPS is required by default. **Allow insecure HTTP** explicitly overrides that requirement without trying to classify the hostname or IP as local. Enabling it can expose provider credentials and prompts in transit and should be paired with trusted-network and firewall controls.
- OpenAI remains restricted to `api.openai.com` even when the HTTP override is enabled.
- Redirects, prohibited network addresses, unsupported message roles, disallowed models, and invalid temperatures are rejected. Model discovery returns only administrator-approved IDs.
- Request bodies are capped at 1 MiB and buffered responses at 16 MiB.
- Each instance permits four concurrent calls and 30 calls per minute.
- Provider error bodies, prompts, answers, and credentials are not logged by default.
- Provider authentication failures and rate limits return sanitized metadata.

Treat provider-side budgets and organization billing controls as the authoritative cost limit, and use network egress/firewall policy as a second SSRF boundary.

## Token behavior

The effective hard cap is `min(panel Maximum output tokens, data-source maxOutputTokens)`. If **Provider/model default output limit** is enabled, the panel omits its cap but the administrator ceiling is still sent. **Requested answer max tokens (soft)** is only a prompt instruction and cannot guarantee an exact token count.

## Integrated Docker test

The panel repository's Docker Compose environment mounts both sibling `dist` directories and provisions the secure instance plus a dashboard already configured with UID `intelligence-gateway-secure`. Build both plugins, set `OPENAI_API_KEY`, start the panel Compose project, and open <http://localhost:3004>.
