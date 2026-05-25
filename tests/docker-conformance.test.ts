import { describe, it } from "node:test";
import { TYPEBERRY_IMAGE } from "./common.js";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 30 * 60 * 1_000;

describe("Docker can execute JAM conformance tests", { timeout: TEST_TIMEOUT }, () => {
  it("should run latest JAM conformance tests", async () => {
    const proc = ExternalProcess.spawn(
      "docker-conformance-tests",
      "docker",
      "run",
      "--mount",
      "type=bind,src=./picofuzz-conformance-data/jam-conformance,dst=/tests,readonly",
      "--rm",
      "--entrypoint",
      "/bin/bash",
      TYPEBERRY_IMAGE,
      "-c",
      "npm run jam-conformance:0.7.2 -w @typeberry/test-runner ../tests/fuzz-reports/0.7.2/traces/**/*.json",
    ).terminateAfter(TEST_TIMEOUT);

    await proc.cleanExit;
  });
});
