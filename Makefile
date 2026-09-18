SHELL := /bin/bash
.SILENT: release verify-vercel-team

release: verify-vercel-team
	if [ "$$(git branch --show-current)" != "staging" ]; then echo "release can only be run from staging branch."; exit 1; fi
	if [ -z "$(tag)"  ]; then echo "tag is required."; exit 1; fi
	if [[ "$(tag)" =~ ^v ]]; then \
		git tag $(tag); \
		git push origin "$(tag)" && \
		bash "$(CURDIR)/scripts/watch-release.sh" "$(tag)"; \
	else \
		echo "Tag name must start with v (eg, v0.0.1)"; \
		exit 1; \
	fi

verify-vercel-team:
	command -v curl >/dev/null || { echo "curl is required."; exit 1; }
	command -v node >/dev/null || { echo "node is required."; exit 1; }
	bash "$(CURDIR)/scripts/verify-vercel-for-release.sh"
