# Davxy/traces block dumps

Block dumps from w3f-davxy (GP 0.7.2) test vectors & the chain spec file.
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

DIR=$1 # fallback,safrole,storage,storage_light

for json_file in ./test-vectors/w3f-davxy_072/traces/$DIR/*.json; do
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

# create a single file
cat $DIR/*.bin > $DIR.bin

```

Note that the chain spec may change between versions as well. In such case it needs
to be regenerated as well.

```bash
npx @typeberry/convert \
  ./test-vectors/w3f-davxy_072/traces/fallback/genesis.json \
  stf-genesis \
  as-jip4 \
  to-json \
  chain-spec.json
```

# Full chainspec block dump (`full/`)

A dump of **100,052 blocks** (time slots `0..100051`; the slot-0 block is the
genesis block) produced by a running JAM chain using the **full** chainspec.

- `full/chain-spec-full.json` — JIP-4 chain spec (genesis header + full genesis state).
- `full/chain-100k.bin` — all blocks concatenated (~144 MB). Too large for git;
  distributed as a GitHub release asset and fetched on demand:

```cmd
bash ./full/fetch.sh
```

To import the dump in typeberry:

```cmd
npm start -- \
  --config=default \
  --config=.flavor="full" \
  --config=.chain_spec=./block-dumps/full/chain-spec-full.json \
  import ./block-dumps/full/chain-100k.bin
```

## Publishing a new dump

1. Produce the dump (e.g. `jam export`) and the matching JIP-4 chain spec.
2. Create a new release tag (e.g. `block-dumps-full-v2`) on this repository and
   upload the `.bin` as an asset:
   `gh release create block-dumps-full-v2 ./full/chain-100k.bin --title "..." --notes "..."`
3. Update `full/chain-100k.bin.sha256` (`shasum -a 256 chain-100k.bin > chain-100k.bin.sha256`)
   and `ASSET_URL` in `full/fetch.sh`.
4. Regenerate the fuzz-message dataset in
   [picofuzz-full-chain-data](https://github.com/FluffyLabs/picofuzz-full-chain-data)
   (`./populate.sh`) and bump the submodule.
