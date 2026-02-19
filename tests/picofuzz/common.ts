import { afterEach, beforeEach, describe, it } from "node:test";
import { createSharedVolume, picofuzz, typeberry } from "../common.js";
import type { ExternalProcess } from "../external-process.js";

const timeout = 10 * 60 * 1000;

export function runPicofuzzTest(
  name: string,
  directory: string,
  {
    initGenesisFromAncestry,
    repeat = 10,
    noLogs = false,
    ignore = [],
  }: {
    initGenesisFromAncestry?: boolean;
    repeat?: number;
    noLogs?: boolean;
    ignore?: string[];
  } = {},
) {
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
        dockerArgs: noLogs ? ["-e", "JAM_LOG=info"] : [],
        options: {
          initGenesisFromAncestry,
        },
      });
      picofuzzProc = await picofuzz({
        timeout,
        dir: directory,
        repeat,
        sharedVolume: sharedVolume.name,
        statsFile: `${name}.csv`,
        ignore,
      });

      await picofuzzProc.cleanExit;
      console.info("✅ Importing successful");
    });
  });
}
