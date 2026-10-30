# Intelligence Gateway 1.1.2

Fixes tall-dashboard image capture on Grafana 12.4.0 by selecting the actual document scroller. Stalled scrolling now stops capture with an explicit error. Existing image limits, gateway-panel exclusion, preview review, and explicit image submission remain in place.

Requires companion data source 1.1.0 or later. No companion upgrade is needed for this panel patch. Restart Grafana after installation and reload the browser.

Release preparation does not imply publication, signing, or a catalog update. Verify the final tagged archive using the release workflow before submission.
