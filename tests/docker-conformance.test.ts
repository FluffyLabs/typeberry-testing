import { describe, it } from "node:test";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 10 * 60 * 1_000;

describe("Docker can execute JAM conformance tests", { timeout: TEST_TIMEOUT }, () => {
  it("should run latest JAM conformance tests", async () => {
    const proc = ExternalProcess.spawn(
      "docker-conformance-tests",
      "docker",
      "run",
      "--mount",
      "type=bind,src=./jam-conformance,dst=/tests,readonly",
      "--rm",
      "--entrypoint",
      "/bin/bash",
      "ghcr.io/fluffylabs/typeberry:latest",
      "-c",
      "npm run jam-conformance:0.7.0 -w @typeberry/test-runner ../tests/fuzz-reports/0.7.0/traces/**/*.json",
    ).terminateAfter(TEST_TIMEOUT);

    await proc.cleanExit;
  });
});
