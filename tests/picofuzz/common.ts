import { afterEach, beforeEach, describe, it } from "node:test";
import { createSharedVolume, picofuzz, typeberry } from "../common.js";
import type { ExternalProcess } from "../external-process.js";

const timeout = 10 * 60 * 1000;

export function runPicofuzzTest(name: string, directory: string, repeat: number) {
  describe(`[picofuzz] ${name}`, { timeout }, () => {
    let typeberryProc: ExternalProcess | null = null;
    let picofuzzProc: ExternalProcess | null = null;
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
        await picofuzzProc?.terminate();
      } catch {
        // ignore
      }

      sharedVolume.stop();
    });

    it(`should run ${name} tests`, async () => {
      typeberryProc = await typeberry({
        timeout,
        sharedVolume: sharedVolume.name,
      });
      picofuzzProc = await picofuzz({
        timeout,
        dir: directory,
        repeat: repeat,
        sharedVolume: sharedVolume.name,
      });

      await picofuzzProc.cleanExit;
      console.info("✅ Importing successful");
    });
  });
}
