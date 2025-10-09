#!/bin/bash
#
cd "$(dirname "${BASH_SOURCE[0]}")"

set -ex

CONVERT="npm exec @typeberry/convert --"
SOURCE=../jam-test-vectors/traces
DEST=../picofuzz-data
VERSION_FILE=$DEST/version

# Get the current jam-test-vectors ref
JAM_VECTORS_REF=$(cd ../jam-test-vectors && git rev-parse HEAD)

# Check if version file exists and matches
if [ -f "$VERSION_FILE" ]; then
  CURRENT_VERSION=$(cat "$VERSION_FILE")
  if [ "$CURRENT_VERSION" = "$JAM_VECTORS_REF" ]; then
    echo "Version matches ($JAM_VECTORS_REF), nothing to do."
    echo "Remove $VERSION_FILE to regenerate the test cases."
    exit 0
  fi
fi

echo "Generating test data from jam-test-vectors ref: $JAM_VECTORS_REF"

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
        $DEST/$DIR/$FILE_NUM.bin &

      # Limit concurrent jobs to 20
      if (( $(jobs -r | wc -l) >= 20 )); then
        wait # and wait for all of them to finish
      fi
  done

  wait
done

# Save the version after successful completion
echo "$JAM_VECTORS_REF" > "$VERSION_FILE"
echo "Successfully generated test data. Version saved to $VERSION_FILE"
