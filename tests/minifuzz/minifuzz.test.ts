import { afterEach, describe, it } from 'node:test';
import { readdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { minifuzz, TEST_TIMEOUT, typeberry } from './common.js';
import { ExternalProcess } from '../../runner/external-process.js';

const EXAMPLES_DIR = 'jam-conformance/fuzz-proto/examples/v1/no_forks';
const MINIFUZZ_BUILD_SCRIPT = 'utils/minifuzz-docker-build.sh';

describe('no_forks', { timeout: TEST_TIMEOUT }, () => {

  let typeberryProc: ExternalProcess | null = null;
  let minifuzzProc: ExternalProcess | null = null;

  afterEach(() => {
    typeberryProc?.terminate();
    minifuzzProc?.terminate();
  })

  it('should run no_forks tests', async () => {
    typeberryProc = await typeberry();
    minifuzzProc = await minifuzz(EXAMPLES_DIR, 20);

    // Wait for multiple message processing
    await minifuzzProc.waitForMessage(/Found \d+ fuzzer files to process/);
    await minifuzzProc.waitForMessage(/Processing pair 1:/);
    console.log("✅ First message pair processed");

    await minifuzzProc.cleanExit;
  });
});
