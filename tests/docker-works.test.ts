import { describe, it} from 'node:test';
import {ExternalProcess} from "../runner/external-process.js";

const TEST_TIMEOUT = 30_000;

describe('Docker image works', { timeout: TEST_TIMEOUT }, () => {
  it('should display help', async () => {
    const proc = ExternalProcess
      .spawn("docker", "docker", "run", "ghcr.io/fluffylabs/typeberry:latest", "--help")
      .terminateAfter(TEST_TIMEOUT);

    await proc.waitForMessage(/typeberry\/jam.*by Fluffy Labs/)
  });

  it('should start fuzz target and gracefuly stop', async () => {
    const proc = ExternalProcess
        .spawn("docker", "docker", "run", "ghcr.io/fluffylabs/typeberry:latest", "fuzz-target")
        .terminateAfter(TEST_TIMEOUT);
    await proc.waitForMessage(/IPC server is listening/);
    await proc.terminate();
  })
});
