# Draft reply to Grafana review

Review and send this message manually. It has not been sent on your behalf.

---

Hi Grafana team,

Thank you for trying the plugin and for the feedback. The original demo was misleading: the sentence in your screenshot was a fixed mock-provider connectivity response, not an AI assessment. I should have made that distinction explicit.

The intended use is to help operators turn selected Grafana query results into an evidence-based narrative beside their charts—for example, comparing traffic across sites, drafting a handover, or identifying which checks to perform next during an incident. It works with Grafana DataFrames; the CSV is only a portable demo fixture, not a required data format.

The two plugins have separate roles:

- The Intelligence Gateway panel builds a bounded prompt from its query results, dashboard time range, and configured operational context, and renders the model's response.
- The Intelligence Gateway Secure AI data source handles provider access on the Grafana server, encrypted credential storage, and administrator limits. Dashboards contain its UID, not the provider credential. It also supports submitting a supplied prompt through its query editor and returning an answer DataFrame.

I have updated the demo to explain those roles and clearly mark its default response as “MOCK MODE — no AI inference performed.” The default remains credential-free for reproducible connectivity testing.

For the actual use case, the new walkthrough uses eight synthetic traffic samples. DC1 increases as DC2 decreases, while their combined rate remains 1,000 requests/minute. A genuine LM Studio assessment identifies that pattern, states that the rates alone cannot prove an outage or root cause, and suggests concrete checks. Changing the final DC2 value to 300 produces an assessment that correctly identifies a final combined rate of 1,300. The screenshots show the real generated responses, not canned answers.

- [Reviewer walkthrough and real-provider setup](https://github.com/digitalrcs/grafana-intelligence-gateway/wiki/Reviewer-Walkthrough)
- [Actual screenshots, configuration, token usage, and capture provenance](https://github.com/digitalrcs/grafana-intelligence-gateway/blob/main/docs/LIVE_REVIEW_EVIDENCE.md)
- [Data-source testing and review guide](https://github.com/digitalrcs/grafana-intelligence-gateway-datasource/wiki/Testing-and-Review)

Users can select a compatible local model or remote provider, subject to their organization's data-handling policy. Generated assessments require human verification; the plugins do not independently detect incidents, establish root cause, or perform automated remediation.

These updates are in the current source and documentation; existing published release ZIPs and tags have not been replaced. The evidence page identifies the exact local backend branch used for the capture. Please let me know if you would prefer a revised release artifact for the review.

Thanks again,
Dan
