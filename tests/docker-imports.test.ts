import { describe, it } from "node:test";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 5 * 60 * 1_000;

describe("Docker image can import block dumps", { timeout: TEST_TIMEOUT }, () => {

  ['fallback', 'safrole', 'storage', 'storage_light'].forEach((dir) => {
    it(`should import ${dir} blocks`, async () => {
      const proc = ExternalProcess.spawn(
        "docker",
        "docker",
        "run",
        "--mount",
        "type=bind,src=./block-dumps,dst=/block-dumps,readonly",
        "--rm",
        "ghcr.io/fluffylabs/typeberry:latest",
        "import",
        `/block-dumps/${dir}.bin`
      ).terminateAfter(TEST_TIMEOUT);

      await proc.waitForMessage(/Best block: #100/);
    });
  });
});
