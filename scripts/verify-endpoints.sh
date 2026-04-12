#!/usr/bin/env bash
# Post-deploy verification for ExclusiveDetroit live endpoints.
# Run after every push that touches api/ or fetchLiveData.js.
# Usage: sh scripts/verify-endpoints.sh [base_url]
#
# Exit code: 0 = all pass, 1 = one or more failed.

BASE="${1:-https://www.exclusivedetroitapp.com}"
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local response
  local ct
  local http_code

  response=$(curl -sf --max-time 15 -w "\n%{http_code}" "$url" 2>&1)
  local curl_exit=$?
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n -1)

  if [ $curl_exit -ne 0 ]; then
    echo "  FAIL  $label — curl error (exit $curl_exit): $url"
    FAIL=$((FAIL+1))
    return
  fi

  # Must be 2xx
  if [ "$(echo "$http_code" | cut -c1)" != "2" ]; then
    echo "  FAIL  $label — HTTP $http_code: $url"
    echo "        Body: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL+1))
    return
  fi

  # Must be JSON (check first char)
  first=$(echo "$body" | tr -d '[:space:]' | cut -c1)
  if [ "$first" != "{" ] && [ "$first" != "[" ]; then
    echo "  FAIL  $label — Response is not JSON (starts with '$first'): $url"
    echo "        Body: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL+1))
    return
  fi

  # Check for error key in JSON
  if echo "$body" | grep -q '"error"'; then
    echo "  WARN  $label — JSON contains error field: $(echo "$body" | head -c 200)"
    FAIL=$((FAIL+1))
    return
  fi

  echo "  PASS  $label (HTTP $http_code)"
  PASS=$((PASS+1))
}

echo ""
echo "ExclusiveDetroit endpoint verification"
echo "Base: $BASE"
echo "--------------------------------------------"
check "Health"   "$BASE/api/health"
check "Games"    "$BASE/api/events/games"
check "Concerts" "$BASE/api/events/concerts"
check "Theatre"  "$BASE/api/events/theatre"
echo "--------------------------------------------"
echo "  Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
fi
