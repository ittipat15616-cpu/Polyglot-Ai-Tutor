#!/bin/bash
for i in {1..12}; do
  echo "Run $i"
  npx -y tsx translate_examples.cjs
done
