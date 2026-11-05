# Public edition 1.2.0

The public edition supports query-data analysis and explicitly submitted PNG/JPEG uploads. It removes dashboard DOM capture, panel discovery and html-to-image. This is source separation, not a hidden setting.

The private edition is maintained independently with public pushing disabled. Do not copy its source or configuration into this repository. Both editions currently use the same plugin ID; install one per Grafana instance and replace the entire directory before restarting. Separate simultaneous installation would require a reviewed ID migration.

Earlier public tags and releases already contained capture functionality. The current split cannot make that previously public code confidential. Current release documentation describes 1.2.0; historical evidence is not evidence of a current browser pass or catalog approval.

Start with [Installation](Installation), [Panel Setup](Panel-Setup-and-Configuration), [Image Analysis](Image-Analysis), [Development](Development-and-Contributing) and [Readiness](Grafana-Compatibility-and-Certification).
