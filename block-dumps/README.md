# Davxy/traces block dumps

Block dumps from w3f-davxy (GP 0.7.1) test vectors & the chain spec file.
All blocks are concated together.

To import the dump in typeberry:
```cmd
npm start -- import ./fallback.bin
```

Default config/chainspec should have the correct genesis.

The dumps can be (re-)generated from davxy traces test vectors using a similar script:
```bash
#!/bin/bash

set -ex

DIR=fallback

for json_file in ./test-vectors/w3f-davxy_071/traces/$DIR/*.json; do
    # Extract just the filename without path and extension
    filename=$(basename "$json_file" .json)

    # Run the npm command
    npx @typeberry/convert -- \
      "$json_file" \
      stf-vector \
      as-block \
      to-bin \
      "./$DIR/${filename}.bin" || true

    echo "Processed: $json_file -> ./$DIR/${filename}.bin"
done

```
