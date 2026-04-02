#!/bin/bash
for i in $(seq 1 18); do
  output=$(echo '{"unused":true}' | node --experimental-strip-types src/index.ts 2>/dev/null)
  printf "\r\033[2K%s" "$output"
  sleep 0.7
done
echo
