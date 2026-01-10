import { afterEach, beforeEach, describe, it } from "node:test";
import { createSharedVolume, minifuzz, typeberry } from "../common.js";
import type { ExternalProcess } from "../external-process.js";

const timeout = 5 * 60 * 1_000;

export function runMinifuzzTest(name: string, directory: string, steps: number) {
  describe(`[minifuzz] ${name}`, { timeout }, () => {
    let typeberryProc: ExternalProcess | null = null;
    let minifuzzProc: ExternalProcess | null = null;
    let sharedVolume = {
      name: "none",
      stop: () => {},
    };

    beforeEach(() => {
      sharedVolume = createSharedVolume(name);
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

    it(`should run ${name} tests (gp-0.7.2)`, async () => {
      typeberryProc = await typeberry({
        timeout,
        sharedVolume: sharedVolume.name,
        dockerArgs: ["-e", "GP_VERSION=0.7.2"],
      });
      minifuzzProc = await minifuzz({
        timeout,
        dir: directory,
        stopAfter: steps,
        sharedVolume: sharedVolume.name,
      });

      await minifuzzProc.waitForMessage(/Stopping after.*as requested/);
      console.info("✅ Minifuzz finished");
      await minifuzzProc.cleanExit;
      console.info("✅ Importing successful");
    });
  });
}
