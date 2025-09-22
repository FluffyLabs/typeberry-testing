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
  "--stop-signal=SIGINT",
];

export function createSharedVolume() {
  // Clean up any existing volume and create a fresh one
  try {
    execSync(`docker volume rm ${SHARED_VOLUME}`, { stdio: "ignore" });
  } catch {
    // Volume might not exist, ignore
  }
  execSync(`docker volume create ${SHARED_VOLUME}`, { stdio: "ignore" });

  // Initialize the volume with proper permissions
  execSync(`docker run --rm -v ${SHARED_VOLUME}:/shared alpine sh -c "mkdir -p /shared && chmod 777 /shared"`, {
    stdio: "ignore",
  });

  return () => {
    // Clean up the shared volume
    try {
      execSync(`docker volume rm ${SHARED_VOLUME}`, { stdio: "ignore" });
    } catch {
      // Volume might be in use, ignore
    }
  };
}

export async function typeberry({
  dockerArgs = [],
  timeout = TEST_TIMEOUT,
}: {
  dockerArgs?: string[];
  timeout?: number;
} = {}) {
  const typeberry = ExternalProcess.spawn(
    "typeberry-multi",
    "docker",
    "run",
    "--init",
    "--rm",
    ...dockerArgs,
    ...DOCKER_OPTIONS,
    "-v",
    `${SHARED_VOLUME}:/shared`,
    "ghcr.io/fluffylabs/typeberry:latest",
    "fuzz-target",
    SOCKET_PATH,
  ).terminateAfter(timeout);
  await typeberry.waitForMessage(/IPC server is listening/);
  return typeberry;
}

export async function minifuzz(dir: string, stopAfter = 20) {
  return ExternalProcess.spawn(
    "minifuzz-multi",
    "docker",
    "run",
    "--rm",
    "-v",
    `${process.cwd()}/jam-conformance:/app/jam-conformance:ro`,
    "-v",
    `${SHARED_VOLUME}:/shared`,
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

    it(`should run ${name} tests`, async () => {
      typeberryProc = await typeberry();
      minifuzzProc = await minifuzz(directory, steps);

      await minifuzzProc.waitForMessage(/Stopping after.*as requested/);
      await minifuzzProc.cleanExit;
    });
  });
}
