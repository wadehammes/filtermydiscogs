SHELL := /bin/bash
.SILENT: release

release:
	if [ -z "$(tag)"  ]; then echo "tag is required."; exit 1; fi
	if [[ "$(tag)" =~ ^v ]]; then \
		git tag $(tag); \
		git push origin "$(tag)" && \
		printf '\nPushed %s. Remote "Bypassed rule violations … Cannot create ref" on v* tags is expected (ruleset + admin bypass).\n' "$(tag)" && \
		printf '  Confirm create-release succeeded in GitHub Actions.\n'; \
	else \
		echo "Tag name must start with v (eg, v0.0.1)"; \
		exit 1; \
	fi
