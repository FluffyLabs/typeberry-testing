import { afterEach, beforeEach, describe, it } from "node:test";
import type { ExternalProcess } from "../../runner/external-process.js";
import { createSharedVolume, minifuzz, typeberry } from "./common.js";

const TIMEOUT_MINUTES = 10;

const EXAMPLES_DIR = "jam-conformance/fuzz-proto/examples/v1/forks";
describe("Burn mode", { timeout: TIMEOUT_MINUTES * 60 * 1_000 }, () => {
  let typeberryProc: ExternalProcess | null = null;
  let minifuzzProc: ExternalProcess | null = null;
  let sharedVolume = () => {};

  beforeEach(() => {
    sharedVolume = createSharedVolume();
  });

  afterEach(async () => {
    // terminate the processes
    try {
      await typeberryProc?.terminate();
      await minifuzzProc?.terminate();
    } catch {
      // ignore
    }

    sharedVolume();
  });

  it("should keep reasonable resources when running minifuzz many times", async () => {
    typeberryProc = await typeberry({
      timeout: TIMEOUT_MINUTES * 60 * 1_000,
    });

    const NO_OF_ROUNDS = 50;
    console.time("minifuzz");
    for (let i = 0; i < NO_OF_ROUNDS; ++i) {
      minifuzzProc = await minifuzz(EXAMPLES_DIR, 100);
      await minifuzzProc.waitForMessage(/Stopping after.*as requested/);
      console.info(`✅ Minifuzz finished (round ${i}/${NO_OF_ROUNDS})`);
      await minifuzzProc.cleanExit;
    }
    console.timeEnd("minifuzz");
    console.info("✅ Importing successful");
  });
});
