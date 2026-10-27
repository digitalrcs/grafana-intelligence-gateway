# Copilot Studio and Enterprise Authentication

## Current status

Version **1.1.0** includes a **Copilot Studio Direct Line preview adapter** in the required secure companion data source. Use panel and companion **1.1.0 or later** together. It supports a narrowly defined, authenticated channel protocol with mock/contract tests. It has not been validated against an enterprise tenant, certified by Microsoft, or approved for corporate data. Version 1.0.1 predates this feature.

**Corporate SSO, delegated Entra sign-in, on-behalf-of token exchange, and app-only Direct-to-Engine access are not implemented.** The adapter never reuses a browser login or disables an agent's authentication. An OAuth/sign-in challenge stops the assessment with an explicit unsupported-authentication error. A channel secret is not an end-user identity.

Copilot Studio uses published agents, conversations, and activities rather than the other providers' chat-completion protocol. Select **Copilot Studio** in the companion; do not paste a Studio website URL into an OpenAI-compatible setting.

## Configure the Direct Line preview

Only an authorized administrator should configure this path after approving the agent, data classification, and channel. It is not a workaround for an enterprise agent that requires the viewer's SSO identity.

1. Publish an assessment-only Copilot Studio agent approved for this integration. Keep the existing agent authentication policy intact. Confirm the tenant permits secured Direct Line access and the agent's behavior does not require interactive sign-in for this use.
2. In Copilot Studio, open **Settings > Security > Web channel security**, enable **Require secured access**, and obtain Secret 1 or Secret 2 through the approved secret-handling process. Store the secret only in the companion's **Direct Line secret** field (`secureJsonData.directLineSecret`). A Teams-only license may not expose channel secrets. See [Microsoft channel security](https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-web-security).
3. Select provider `copilot-studio`. Set **Base URL** to the approved region's endpoint: `https://directline.botframework.com/v3/directline`, `https://europe.directline.botframework.com/v3/directline`, or `https://india.directline.botframework.com/v3/directline`. These are the supported HTTPS hosts; arbitrary URLs, custom proxies, and other clouds are not accepted. Select the matching agent region, not a convenient alternative. See [Direct Line regional endpoints](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-api-reference?view=azure-bot-service-4.0).
4. Set the default model field to a descriptive local alias, for example `dashboard-assessment-agent`, and use the same alias in the allowed-model list. This label does not select or change the agent's underlying model. The channel secret identifies the configured agent. Different aliases on one data source do not route to different agents; use separate data sources and secrets for different agents.
5. For images, enable **File uploads** on the agent, turn on **Enable image analysis** in the companion, and add the agent alias to **Allowed vision models**. Use only approved synthetic test images until live image processing is verified.
6. Set the companion timeout to an appropriate bounded value, then **Save & test**. This test exchanges and discards a scoped Direct Line token; it sends no prompt, starts no agent conversation, and does not verify end-user authorization or image understanding.
7. Perform an approved synthetic assessment and verify the response contract below. Do not move corporate data into this test merely because the credential check succeeds.

The agent owns temperature, output-token policy, model selection, and tools. Direct Line does not enforce the panel's temperature or maximum-output-token setting. The model list contains administrator-configured aliases, not discovered Microsoft foundation models. Role-labeled system/user/assistant messages are sent as plain request context; they do not override the published agent's system instructions.

## Response and security contract

Each assessment uses a cryptographically random channel user ID and a fresh conversation token/conversation. Tokens remain in backend memory, are not sent to the browser, and are not persisted. The entire operation is bounded by the companion timeout and token lifetime; it does not refresh or resume expired conversations. The adapter uses actual validated PNG/JPEG bytes in a multipart upload, never externally hosted image URLs. It does not follow redirects, `streamUrl`, response attachment URLs, or sign-in links.

Replies must come from an actor with `role: bot`, belong to this conversation, and match the submitted activity's `replyToId`. Duplicate activity IDs are ignored and polling preserves Microsoft watermarks. Text is collected until a correlated message supplies `inputHint: acceptingInput` or `expectingInput`, or the agent sends a correlated `endOfConversation`. The first progress message is not treated as completion. Responses are bounded in size and activity count.

Direct Line has no universal final-response marker. This preview deliberately requires the readiness contract above instead of guessing completion from a quiet period. If a published agent does not emit it, the assessment reports an incomplete-turn timeout; it does not return partial progress as a successful answer. Agents that request more information can return that request as text, but the panel is a one-shot assessment interface, not an interactive conversation client. See [Microsoft's correlation and completion discussion](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/conversational-agents-performance-testing-direct-line).

The adapter distinguishes channel credential denial, interactive sign-in requirements, rate limiting, rejected upload size, invalid/oversized responses, cancellation, incomplete-turn timeout, and empty/non-text output. Provider error bodies, tokens, and confidential prompt contents are not echoed in error messages. Token expiry can also cause an authentication failure or shorten the assessment deadline. Mock tests verify these boundaries; they cannot prove a tenant allows the channel or that the published agent reads images correctly.

## SSO login is not an integration credential

Being able to sign in to Copilot Studio with a corporate SSO account establishes access to that application. It does not establish that the user can register an application, invoke a particular published agent through an API, grant consent, or send dashboard images to it. Do not copy browser cookies, session tokens, or captured authorization headers into Grafana.

Microsoft's documented interactive client path uses the **Copilot Studio client in Microsoft 365 Agents SDK**, an approved Microsoft Entra application registration, user sign-in, and the delegated Power Platform API permission **`CopilotStudio.Copilots.Invoke`**. The caller's Entra sign-in and the published agent's own authentication settings are separate. Organization consent, agent sharing, Conditional Access, and data-loss-prevention policies still apply. See [Microsoft's SDK integration and interactive sign-in guide](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk).

For an SSO-protected enterprise agent, the recommended starting point is an administrator-approved **delegated user flow** that preserves the user's identity and agent permissions. This is an architectural recommendation, not an implemented feature or a statement that a particular tenant allows it. A future Grafana integration must implement an approved login/redirect and token-lifecycle design; copying a long-lived access token into a shared data-source secret is not a replacement for delegation.

## Credentials and integration options

| Option                                                                                       | What it represents                                                                                                                                  | Status for this plugin                                                                  |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Entra delegated access token                                                                 | A signed-in user calling the approved API with granted scopes. MFA/Conditional Access and user/agent access remain relevant.                        | Recommended enterprise investigation path; not implemented.                             |
| Entra application identity using certificate, federation, managed identity, or client secret | An application rather than a human user. A client secret alone does not grant Copilot access or make an endpoint support app-only authentication.   | Requires explicit tenant/API support and approval; not implemented.                     |
| Direct Line channel secret                                                                   | Authorization to the configured channel, not proof of an end user's enterprise identity. The backend exchanges it for isolated conversation tokens. | Implemented preview transport; interactive agent sign-in is explicitly unsupported.     |
| Grafana service-account token                                                                | Access to the selected Grafana organization's HTTP API, such as the Grafana LLM app resource endpoint.                                              | Used for the Grafana LLM adapter only; cannot authenticate to Microsoft Copilot Studio. |
| Corporate browser SSO cookie                                                                 | A browser session for a particular application.                                                                                                     | Never a supported stored integration credential.                                        |

Microsoft's official Direct-to-Engine **service-to-service** documentation currently labels this capability **Private Preview**, enabled per environment/tenant. It describes application and on-behalf-of modes with agent-sharing requirements. App-only mode has restrictions including no end-user context; it must not be assumed available for an SSO-protected corporate agent. Do not select **No authentication** merely to satisfy an integration example. Review availability with the tenant administrator and Microsoft before designing around it. See [official Copilot Studio client S2S documentation](https://github.com/microsoft/Agents/blob/main/docs/copilot-studio-client-s2s-doc.md).

The standard [custom-client documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-connect-bot-to-custom-application) describes Direct Line token acquisition, sending activities, receiving replies, and token refresh. Its token is not an end-user sign-in token. A successful send acknowledges an activity; the adapter must separately receive the agent's answer. This is not the same as a one-request Chat Completions call.

## Image support requires an approved channel and agent

Microsoft documents file/image input for supported channels including Direct Line/web chat, with **File uploads** enabled on the agent. It does not imply that every API, authenticated channel, or tenant processes attachments. The documented image formats include PNG and JPEG, and the current individual-file limit is 15 MB; the DigitalRCS image limits are lower. Customer-managed-key environments and some channels have additional restrictions. See [Copilot Studio file input](https://learn.microsoft.com/en-us/microsoft-copilot-studio/image-input-analysis).

The adapter uses Direct Line's multiple-attachment multipart transport with a JSON message activity. That transport capability alone does not prove that a particular enterprise agent will interpret the images. Deterministic tests cover payload handling, authentication errors, isolation, timeout, cancellation, and negative paths; deployment still requires positive tests with approved synthetic images. See [Direct Line attachment transport](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-send-activity?view=azure-bot-service-4.0).

Copilot model choice, generation controls, and agent tools are managed by the agent's owner. The companion reports that generation controls are not supported for this provider. Do not interpret an alias, a prompt asking for a shorter answer, or a UI value as an enforced provider token limit.

## Questions for enterprise administrators

Before implementing or testing a corporate integration, obtain answers through the organization's approved process. Share only non-secret metadata in development discussions.

1. **Agent and environment:** Is there a published Copilot Studio agent approved for this use? What are its tenant, environment, schema name, region/cloud, and approved connection method? Access to the Studio authoring UI alone is insufficient.
2. **User identity:** Must each Grafana viewer authenticate as themselves? Which Entra authorization flow, redirect URIs, scopes, consent process, Conditional Access rules, and session lifetime are approved? Is an approved broker required for on-behalf-of access?
3. **Application identity:** Is app-only access actually supported and enabled for this agent/environment? If so, which documented API and credential type are approved, who owns rotation, and what agent-sharing permissions apply? Do not infer approval from the ability to create a client secret.
4. **Images and data governance:** Are dashboard screenshots and attachments permitted? Which classifications must be excluded or redacted? What are the approved model/provider, processing region, DLP rules, retention, logging, and deletion requirements?
5. **Agent behavior:** Is the agent assessment-only, or can it invoke tools/actions? Are those actions approved for these users and data? Dashboard or image text must not grant additional authority.
6. **Network and operations:** Which outbound endpoints, proxies, certificates, quotas, timeout limits, audit events, and support owners are required? How are conversation isolation and user-access revocation enforced?
7. **Test approval:** Can a non-production agent and synthetic fixtures be used to validate authentication and vision? What evidence and security review are required before production access?

Until these decisions are approved, use only synthetic or explicitly approved non-sensitive content on an already approved provider. Do not send customer, employee, or other regulated data as an exploratory test.

## Requirements for future enterprise identity support

The provider integration must live behind the companion's security boundary, preserve the approved identity model, isolate conversations per user/request, validate configured origins and identifiers, and bound all uploads, polling/streaming, and responses. Persisted service credentials belong in Grafana `secureJsonData` or an approved server-side secret system; user access/refresh tokens require a per-user secure lifecycle and must not be shared through dashboard JSON or one static data-source credential.

Future delegated-auth error messages must additionally distinguish missing consent, denied user/agent access, and expired user authentication without exposing tokens or sensitive content. No broad Copilot compatibility, SSO support, or production-readiness claim should be made until the approved end-to-end path has been tested. Direct Line preview coverage is not evidence that an enterprise SSO integration exists.
