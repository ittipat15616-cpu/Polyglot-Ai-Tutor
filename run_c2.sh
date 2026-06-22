#!/bin/bash
for i in {1..7}; do
  echo "Run $i"
  npx -y tsx gen_c2_examples.cjs
done
