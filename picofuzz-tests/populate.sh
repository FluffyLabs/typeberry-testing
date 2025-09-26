#!/bin/bash
#
cd "$(dirname "${BASH_SOURCE[0]}")"

set -ex

CONVERT="npx @typeberry/convert@next --"
SOURCE=../jam-test-vectors/traces
DEST=../picofuzz-tests

for DIR in fallback safrole storage storage_light; do
  mkdir -p $DEST/$DIR || true

  # First produce genesis
  $CONVERT $SOURCE/$DIR/genesis.bin \
    stf-genesis as-fuzz-message to-bin \
    $DEST/$DIR/00000000.bin

  # Then convert the blocks
  for I in {1..100}; do
      # Format the number with leading zeros (8 digits)
      FILE_NUM=$(printf "%08d" $I)

      $CONVERT \
        $SOURCE/$DIR/$FILE_NUM.bin \
        stf-vector as-fuzz-message to-bin \
        $DEST/$DIR/$FILE_NUM.bin
  done
done
