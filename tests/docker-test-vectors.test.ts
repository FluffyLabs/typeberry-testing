import { describe, it } from "node:test";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 20 * 60 * 1_000;

describe("Docker can execute tests", { timeout: TEST_TIMEOUT }, () => {
  it("should run latest w3f test vectors", async () => {
    const proc = ExternalProcess.spawn(
      "docker-w3f-tests",
      "docker",
      "run",
      "--mount",
      "type=bind,src=./picofuzz-data/jam-test-vectors,dst=/tests,readonly",
      "--rm",
      "--entrypoint",
      "/bin/bash",
      "ghcr.io/fluffylabs/typeberry:latest",
      "-c",
      "npm run w3f-davxy:0.7.0 -w @typeberry/test-runner ../tests/traces/**/*.json",
    ).terminateAfter(TEST_TIMEOUT);

    await proc.cleanExit;
  });
});
