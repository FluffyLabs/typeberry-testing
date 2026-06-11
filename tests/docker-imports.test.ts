import { describe, it } from "node:test";
import { TYPEBERRY_IMAGE } from "./common.js";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 5 * 60 * 1_000;

describe("Docker image can import block dumps", { timeout: TEST_TIMEOUT }, () => {
  ["fallback", "safrole", "storage", "storage_light"].forEach((dir) => {
    it(`should import ${dir} blocks`, async () => {
      const proc = ExternalProcess.spawn(
        "docker",
        "docker",
        "run",
        "--mount",
        "type=bind,src=./block-dumps,dst=/block-dumps,readonly",
        "--rm",
        TYPEBERRY_IMAGE,
        "--config=default",
        "--config=.chain_spec=/block-dumps/chain-spec.json",
        "import",
        `/block-dumps/${dir}.bin`,
      ).terminateAfter(TEST_TIMEOUT);

      // typeberry renamed the importer's best-block log from `Best block: #N`
      // to `🧊 Best: #N`; match both forms so a cosmetic upstream log change
      // doesn't let the container finish the import, exit 0, and fail the test
      // with "Exited" (the regex never matching). Asserting #100 still guards
      // against a short import (e.g. the swallowed-EOF reader bug).
      await proc.waitForMessage(/Best(?: block)?: #100/);
    });
  });
});
