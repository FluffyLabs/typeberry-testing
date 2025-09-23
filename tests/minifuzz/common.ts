import { execSync } from "node:child_process";
import { afterEach, beforeEach, describe, it } from "node:test";
import { ExternalProcess } from "../../runner/external-process.js";

const SOCKET_PATH = "/shared/jam_target.sock";
export const SHARED_VOLUME = "jam-ipc-volume";

export const TEST_TIMEOUT = 120_000;

const DOCKER_OPTIONS = [
  "--cpu-shares",
  "2048",
  "--cpu-quota",
  "-1",
  "--memory",
  "512m",
  "--memory-swap",
  "0m",
  "--shm-size",
  "256m",
  "--ulimit",
  "nofile=1024:1024",
  "--ulimit",
  "nproc=1024:1024",
  "--sysctl",
  "net.core.somaxconn=1024",
  "--sysctl",
  "net.ipv4.tcp_tw_reuse=1",
  "--security-opt",
  "seccomp=unconfined",
  "--security-opt",
  "apparmor=unconfined",
  "--cap-add",
  "SYS_NICE",
  "--cap-add",
  "SYS_RESOURCE",
  "--cap-add",
  "IPC_LOCK",
  "--stop-timeout=5",
];

export function createSharedVolume(name = "") {
  const volumeName = `${SHARED_VOLUME}${name}`;
  // Clean up any existing volume and create a fresh one
  try {
    execSync(`docker volume rm ${volumeName}`);
  } catch {
    // Volume might not exist, ignore
  }
  execSync(`docker volume create ${volumeName}`);

  // Initialize the volume with proper permissions
  execSync(`docker run --rm -v ${volumeName}:/shared alpine sh -c "mkdir -p /shared && chmod 777 /shared"`);

  return {
    name: volumeName,
    stop: () => {
      // Clean up the shared volume
      try {
        execSync(`docker volume rm ${volumeName}`);
      } catch {
        // Volume might be in use, ignore
      }
    },
  };
}

export async function typeberry({
  dockerArgs = [],
  sharedVolume = SHARED_VOLUME,
  timeout = TEST_TIMEOUT,
}: {
  dockerArgs?: string[];
  sharedVolume?: string;
  timeout?: number;
} = {}) {
  const typeberry = ExternalProcess.spawn(
    "typeberry-multi",
    "docker",
    "run",
    "--rm",
    ...dockerArgs,
    ...DOCKER_OPTIONS,
    "-v",
    `${sharedVolume}:/shared`,
    "ghcr.io/fluffylabs/typeberry:latest",
    "fuzz-target",
    SOCKET_PATH,
  ).terminateAfter(timeout);
  await typeberry.waitForMessage(/IPC server is listening/);
  return typeberry;
}

export async function minifuzz({
  dir,
  stopAfter = 20,
  sharedVolume = SHARED_VOLUME,
}: {
  dir: string;
  stopAfter?: number;
  sharedVolume?: string;
}) {
  return ExternalProcess.spawn(
    "minifuzz-multi",
    "docker",
    "run",
    "--rm",
    "-v",
    `${process.cwd()}/jam-conformance:/app/jam-conformance:ro`,
    "-v",
    `${sharedVolume}:/shared`,
    "minifuzz",
    "--trace-dir",
    `/app/${dir}`,
    "--target-sock",
    SOCKET_PATH,
    "--stop-after",
    `${stopAfter}`,
    "--spec",
    "tiny",
  ).terminateAfter(TEST_TIMEOUT - 10_000);
}

export function runMinifuzzTest(name: string, directory: string, steps: number) {
  describe(name, { timeout: TEST_TIMEOUT }, () => {
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

    it(`should run ${name} tests`, async () => {
      typeberryProc = await typeberry({
        sharedVolume: sharedVolume.name,
      });
      minifuzzProc = await minifuzz({
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
