import { afterEach, beforeEach, describe, it } from "node:test";
import { createSharedVolume, picofuzz, typeberry } from "../common.js";
import type { ExternalProcess } from "../external-process.js";

export function runPicofuzzTest(
  name: string,
  directory: string,
  {
    initGenesisFromAncestry,
    repeat = 10,
    noLogs = false,
    ignore = [],
    highMemory = false,
    flavour = "tiny",
    memory,
    timeoutMs = 10 * 60 * 1000,
  }: {
    initGenesisFromAncestry?: boolean;
    repeat?: number;
    noLogs?: boolean;
    ignore?: string[];
    highMemory?: boolean;
    flavour?: "tiny" | "full";
    memory?: string;
    timeoutMs?: number;
  } = {},
) {
  describe(`[picofuzz] ${name}`, { timeout: timeoutMs }, () => {
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
        timeout: timeoutMs,
        sharedVolume: sharedVolume.name,
        dockerArgs: noLogs ? ["-e", "JAM_LOG=info"] : [],
        options: {
          initGenesisFromAncestry,
          highMemory,
          memory,
          // typeberry config uses the American spelling; picofuzz CLI the British one.
          flavor: flavour,
        },
      });
      picofuzzProc = await picofuzz({
        timeout: timeoutMs,
        dir: directory,
        repeat,
        sharedVolume: sharedVolume.name,
        statsFile: `${name}.csv`,
        ignore,
        flavour,
      });

      await picofuzzProc.cleanExit;
      console.info("✅ Importing successful");
    });
  });
}
