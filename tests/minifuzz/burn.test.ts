import { afterEach, beforeEach, describe, it } from "node:test";
import { createSharedVolume, minifuzz, typeberry } from "../common.js";
import type { ExternalProcess } from "../external-process.js";

const TIMEOUT_MINUTES = 15;
const timeout = TIMEOUT_MINUTES * 60 * 1_000;

const EXAMPLES_DIR = "jam-conformance/fuzz-proto/examples/0.7.2/forks";
describe("Burn mode", { timeout }, () => {
  let typeberryProc: ExternalProcess | null = null;
  let minifuzzProc: ExternalProcess | null = null;
  let sharedVolume = {
    name: "none",
    stop: () => {},
  };

  beforeEach(() => {
    sharedVolume = createSharedVolume("burn");
  });

  afterEach(async () => {
    // terminate the processes
    try {
      await typeberryProc?.terminate();
      await minifuzzProc?.terminate();
    } catch {
      // ignore
    }

    sharedVolume.stop();
  });

  it("should keep reasonable resources when running minifuzz many times", async () => {
    typeberryProc = await typeberry({
      timeout,
      sharedVolume: sharedVolume.name,
      dockerArgs: ["-e", "GP_VERSION=0.7.2"],
    });

    const NO_OF_ROUNDS = 50;
    console.time("minifuzz");
    for (let i = 0; i < NO_OF_ROUNDS; ++i) {
      minifuzzProc = await minifuzz({
        timeout,
        dir: EXAMPLES_DIR,
        stopAfter: 100,
        sharedVolume: sharedVolume.name,
      });
      await minifuzzProc.waitForMessage(/Stopping after.*as requested/);
      console.info(`✅ Minifuzz finished (round ${i}/${NO_OF_ROUNDS})`);
      await minifuzzProc.cleanExit;
    }
    console.timeEnd("minifuzz");
    console.info("✅ Importing successful");
  });
});
