SHELL := /bin/bash
.SILENT: release

release:
	if [ -z "$(tag)"  ]; then echo "tag is required."; exit 1; fi
	if [[ "$(tag)" =~ ^v ]]; then \
		git tag $(tag); \
		git push --tags; \
	else \
		echo "Tag name must start with v (eg, v0.0.1)"; \
		exit 1; \
	fi
