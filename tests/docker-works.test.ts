import { describe, it } from "node:test";
import { CI_LABEL, killContainer, registerContainer, TYPEBERRY_IMAGE, uniqueContainerName } from "./common.js";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 30_000;

describe("Docker image works", { timeout: TEST_TIMEOUT }, () => {
  it("should display help", async () => {
    const name = uniqueContainerName("docker-help");
    registerContainer(name);
    const proc = ExternalProcess.spawn(
      "docker",
      "docker",
      "run",
      "--rm",
      "--name",
      name,
      "--label",
      CI_LABEL,
      TYPEBERRY_IMAGE,
      "--help",
    )
      .terminateAfter(TEST_TIMEOUT)
      .onTerminate(() => killContainer(name));

    await proc.waitForMessage(/typeberry\/jam.*by Fluffy Labs/);
  });

  it("should start fuzz target and gracefully stop", async () => {
    const name = uniqueContainerName("docker-fuzz");
    registerContainer(name);
    const proc = ExternalProcess.spawn(
      "docker",
      "docker",
      "run",
      "--rm",
      "--name",
      name,
      "--label",
      CI_LABEL,
      TYPEBERRY_IMAGE,
      "fuzz-target",
    )
      .terminateAfter(TEST_TIMEOUT)
      .onTerminate(() => killContainer(name));
    await proc.waitForMessage(/PVM Backend/);
    await proc.terminate();
  });
});
