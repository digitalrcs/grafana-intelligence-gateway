# Copilot Studio Notes

Copilot Studio support is experimental because Direct Line and agent endpoints have different conversation, token-exchange, and response contracts.

The current adapter POSTs a message activity to the configured complete endpoint and adds the system prompt to `channelData`. It extracts common text or activity response shapes. Streaming is buffered.

A production adapter should run in a backend, exchange short-lived tokens, create/manage conversations, poll or stream activities as required, validate origins, and translate the specific agent contract into the panel's provider interface.
