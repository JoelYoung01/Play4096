#!/usr/bin/env bash
set -euo pipefail

EXPECTED_VERSION="${1:?Expected version (commit SHA) is required}"
HEALTH_URL="${2:?Health check URL is required}"
TIMEOUT_SECONDS="${3:-300}"
INTERVAL_SECONDS="${4:-10}"

deadline=$((SECONDS + TIMEOUT_SECONDS))
last_response=""
attempt=0

echo "Waiting for deployment version ${EXPECTED_VERSION} at ${HEALTH_URL}"
echo "Timeout: ${TIMEOUT_SECONDS}s, polling every ${INTERVAL_SECONDS}s"

while (( SECONDS < deadline )); do
	attempt=$((attempt + 1))

	if response=$(curl -sf --max-time 15 "$HEALTH_URL" 2>/dev/null); then
		last_response="$response"
		status=$(echo "$response" | jq -r '.status // empty')
		version=$(echo "$response" | jq -r '.version // empty')

		if [[ "$status" == "healthy" && "$version" == "$EXPECTED_VERSION" ]]; then
			echo "Deployment verified after ${attempt} attempt(s)."
			echo "$response" | jq .
			exit 0
		fi

		echo "Attempt ${attempt}: status=${status:-unknown} version=${version:-unknown} (expected ${EXPECTED_VERSION})"
	else
		echo "Attempt ${attempt}: health check request failed, retrying..."
	fi

	sleep "$INTERVAL_SECONDS"
done

echo "Deployment verification failed after ${TIMEOUT_SECONDS}s."
if [[ -n "$last_response" ]]; then
	echo "Last response:"
	echo "$last_response" | jq . 2>/dev/null || echo "$last_response"
else
	echo "No successful health check responses were received."
fi
exit 1
