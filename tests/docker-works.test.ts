import { describe, it } from "node:test";
import { TYPEBERRY_IMAGE } from "./common.js";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 30_000;

describe("Docker image works", { timeout: TEST_TIMEOUT }, () => {
  it("should display help", async () => {
    const proc = ExternalProcess.spawn("docker", "docker", "run", "--rm", TYPEBERRY_IMAGE, "--help").terminateAfter(
      TEST_TIMEOUT,
    );

    await proc.waitForMessage(/typeberry\/jam.*by Fluffy Labs/);
  });

  it("should start fuzz target and gracefully stop", async () => {
    const proc = ExternalProcess.spawn(
      "docker",
      "docker",
      "run",
      "--rm",
      TYPEBERRY_IMAGE,
      "fuzz-target",
    ).terminateAfter(TEST_TIMEOUT);
    await proc.waitForMessage(/PVM Backend/);
    await proc.terminate();
  });
});
