# Reviewer Walkthrough: explain a traffic shift

## What problem does this solve?

An operator can see a change in a chart but still needs to write a handover or decide what to check next. Intelligence Gateway sends selected Grafana query results, reviewed dashboard images, and configurable operational context to an administrator-selected AI model and displays its assessment beside the chart. This walkthrough uses panel and companion **1.1.0 or later**.

Example uses include comparing traffic across sites, summarizing an incident window, and drafting a handover from supplied metrics and runbook context. The input is Grafana DataFrames, not a particular database or CSV format. CSV is only the portable fixture in this example.

The **panel** assembles the bounded data and instructions and renders the response. The **data source** supplies server-side provider access, encrypted credential storage, and administrator policy. The data source does not independently collect dashboard metrics, train a model, detect incidents in the background, or prove a root cause.

## Understand mock versus real inference

| Mode          | What runs                                                             | What it demonstrates                                                                                     |
| ------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Default mock  | A small local HTTP server returning a fixed, clearly labeled receipt  | Panel-to-backend-to-provider connectivity and response rendering; no model inference or analysis quality |
| Real provider | A loaded model in LM Studio or another configured compatible provider | An actual assessment generated from the selected query results and instructions; output varies           |

The earlier demo returned “Review environment response: the secure backend analysis completed successfully.” That was a connection test, not an assessment. The revised dashboard and receipt make this explicit.

## Run the provisioned example

Build both sibling plugins using the commands in [Local provisioning](https://github.com/digitalrcs/grafana-intelligence-gateway/blob/main/provisioning/README.md), then start the panel repository's Docker Compose stack. Open <http://localhost:3004> and choose **Intelligence Gateway: traffic-shift walkthrough** under Dashboards.

1. Read the **Start here** panel.
2. Inspect **Synthetic traffic: requests/minute by data center**.
3. In **Explain the traffic shift**, select **Analyze**.
4. Confirm the result says **MOCK MODE — no AI inference performed**. Changing the data will not change this receipt.
5. Continue below to evaluate genuine inference.

The original larger CSV remains in `testdata/datasource.csv`. The new default fixture is `testdata/reviewer-traffic.csv`; `npm run sync:test-data` synchronizes that file into the provisioned source panel.

## The scenario and independently checkable facts

All eight rows are invented demonstration data, sampled every five minutes on September 18, 2026, in UTC. DC1 and DC2 are request rates in requests/minute, not interval totals.

| UTC sample |   DC1 | DC2 | Combined rate |
| ---------- | ----: | --: | ------------: |
| 12:00      |   500 | 500 |         1,000 |
| 12:15      |   505 | 495 |         1,000 |
| 12:20      |   800 | 200 |         1,000 |
| 12:35      | 1,000 |   0 |         1,000 |

At 12:20 the distribution shifts toward DC1. By 12:35 DC1 carries all observed traffic; every sample still totals 1,000 requests/minute. No error, latency, capacity, deployment, or routing records are supplied. The data alone cannot establish a DC2 outage, failover, or a routing change.

These are human-checkable fixture facts, not canned AI output.

## Use a real model

1. Start LM Studio's server and load a chat-capable model, or prepare another compatible provider.
2. In Grafana, add a **separate Intelligence Gateway Secure AI** data-source instance named **Reviewer live AI**. Keep the mock instance for reproducible smoke tests.
3. Select the provider and its documented base URL reachable **from Grafana's server/container**. For LM Studio on the Docker host this can be `http://host.docker.internal:1234/v1`; for another machine use its reachable hostname. Other providers have different paths: see [AI Providers](Configuration-AI-Providers). Prefer HTTPS. For a trusted HTTP-only lab endpoint, explicitly enable **Allow insecure HTTP**.
4. Enter the exact loaded model ID as the default and allowed model. Choose a bounded output ceiling appropriate for that model; a local reasoning-model test might use 8,192 tokens and a 300-second deadline. If authentication is required, enter it only in the data-source secure credential fields.
5. Select **Save & test**. Success verifies model endpoint access, not inference quality.
6. Duplicate the provisioned dashboard for your experiment. Edit panel 2, select **Reviewer live AI** under **Secure AI data source**, and select the real model. The mock ID `review-model` will not work with the real provider.
7. Change the panel's response description to **Live model response to synthetic data** and retain manual analysis. Match the panel request cap to the approved test budget, for example 8,192 tokens, with a 500-token soft answer target and 300-second panel timeout. A smaller panel cap still wins over the administrator ceiling; reasoning may use that cap before visible text appears. Apply the panel changes.
8. Select **Analyze**. A real answer should discuss DC1/DC2, numeric evidence, uncertainty, and next checks. It must not return the mock receipt.

The panel already includes this task: compare the periods before and after 12:20 UTC, explain distribution and combined rate, cite evidence, state uncertainty, and suggest three verification steps in at most 200 words. The full constructed prompt can be inspected in panel configuration.

Only selected query results and prompt context are sent. Model/provider choice determines where they are processed. No external AI account is required when using a local model without authentication.

## Verify all three evidence modes

| Mode            | Setup                                                                                                                                                                                    | What to verify                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Data only       | Leave images unattached and keep **Queries → Dashboard → Source panel** connected. Select **Analyze**.                                                                                   | The model cites supplied rows and does not claim to have received an image.                         |
| Images only     | Use a separate test panel without query results. Turn **Include query data with images** off. Preview a chart capture or approved synthetic image, then **Use images → Analyze images**. | The model describes known visible facts without refusing solely because query rows are absent.      |
| Data and images | Reconnect query results, leave **Include query data with images** on, and preview the chart capture before **Analyze images**.                                                           | Precise values come from supplied rows; visual observations and missing evidence are distinguished. |

All three need **Secure AI data source**. Image modes also need an administrator-enabled vision policy and a genuinely vision-capable model. Capture supplies pixels, not every pictured panel's raw rows. Use **Remove** or **Remove all images** to discard staged attachments; **Clear analysis** cancels a request and clears the answer, errors, and pending images without modifying source measurements. A successful image assessment releases attachments, so capture again before another image request.

The mock can verify image counts, controls, and transport but cannot assess the chart. A model-list check or a successful data-only answer does not prove vision. Record a separate approved synthetic vision test before claiming that a provider/model combination understands images. Copilot remains a Direct Line preview, not a verified enterprise SSO connection.

## Verify that the model responds to changed input

In your duplicate dashboard, edit source panel 1's TestData CSV. Change the final DC2 value from `0` to `300`, apply, and select **Refresh assessment** in panel 2 (or **Analyze** if there is no existing response). The final combined rate is now 1,300 and DC2 still has traffic. Confirm the constructed prompt includes the changed value and evaluate whether the model reflects it. Do not treat exact wording as a test oracle.

The mock will still return the same receipt. A real model can also make arithmetic or interpretation errors; compare its statements with the source chart and fixture. The plugin provides an assessment for human review, not an authoritative incident diagnosis or automated remediation.

## Captured example

A genuine live-provider capture and its model/settings provenance are documented in [Live Review Evidence](https://github.com/digitalrcs/grafana-intelligence-gateway/blob/main/docs/LIVE_REVIEW_EVIDENCE.md). Screenshots of mock mode are labeled as mock; no canned answer is presented as live inference.

The maintainer's LM Studio example uses an explicit HTTP override on a trusted network, a loaded model allow-list, a 300-second deadline, and an 8,192-token administrator/panel ceiling. An initial 2,400-token request was truncated because the model consumed reasoning tokens; the larger ceiling allowed complete answers. Use limits appropriate to your own model and budget. The evidence page includes the reusable hostname placeholder and exact captured settings.

![Actual LM Studio assessment of the synthetic traffic](https://raw.githubusercontent.com/digitalrcs/grafana-intelligence-gateway/main/docs/images/reviewer-live-assessment.png)

## Why two plugins?

The panel owns the visualization and prompt construction. The data source owns credentials, provider routing, and shared administrator limits. Multiple dashboards can reuse one configured provider without embedding its credential in dashboard JSON. The data source can also submit a supplied prompt through its normal query editor and return an answer DataFrame.

## Reviewer context

The updated provisioning follows Grafana's [test-environment guidance](https://grafana.com/developers/plugin-tools/publish-a-plugin/provide-test-environment). These demo/documentation changes are in the current source; previously published ZIPs and source tags remain unchanged.
