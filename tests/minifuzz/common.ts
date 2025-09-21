import { ExternalProcess } from "../../runner/external-process.js";
import { execSync } from 'node:child_process';
import { afterEach, beforeEach, describe, it } from 'node:test';

export const TEST_TIMEOUT = 120_000;
const SOCKET_PATH = '/shared/jam_target.sock';
export const SHARED_VOLUME = 'jam-ipc-volume';

export function createSharedVolume() {
  // Clean up any existing volume and create a fresh one
  try {
    execSync(`docker volume rm ${SHARED_VOLUME}`, { stdio: 'ignore' });
  } catch {
    // Volume might not exist, ignore
  }
  execSync(`docker volume create ${SHARED_VOLUME}`, { stdio: 'ignore' });

  // Initialize the volume with proper permissions
  execSync(`docker run --rm -v ${SHARED_VOLUME}:/shared alpine sh -c "mkdir -p /shared && chmod 777 /shared"`, { stdio: 'ignore' });

  return () => {
    // Clean up the shared volume
    try {
      execSync(`docker volume rm ${SHARED_VOLUME}`, { stdio: 'ignore' });
    } catch {
      // Volume might be in use, ignore
    }
  };
}

  export async function typeberry() {
  const typeberry = ExternalProcess
    .spawn(
      "typeberry-multi",
      "docker",
      "run",
      "--rm",
      "--stop-signal=SIGINT",
      "-v", `${SHARED_VOLUME}:/shared`,
      "ghcr.io/fluffylabs/typeberry:latest",
      "fuzz-target", SOCKET_PATH
    )
    .terminateAfter(TEST_TIMEOUT);
  await typeberry.waitForMessage(/IPC server is listening/);
  return typeberry;
}

export async function minifuzz(dir: string, stopAfter: number = 20) {
  return ExternalProcess
    .spawn(
      "minifuzz-multi",
      "docker",
      "run",
      "--rm",
      "-v", `${process.cwd()}/jam-conformance:/app/jam-conformance:ro`,
      "-v", `${SHARED_VOLUME}:/shared`,
      "minifuzz",
      "--trace-dir", `/app/${dir}`,
      "--target-sock", SOCKET_PATH,
      "--stop-after", `${stopAfter}`,
      "--spec", "tiny"
    )
    .terminateAfter(TEST_TIMEOUT - 10_000);
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
  })

  it(`should run ${name} tests`, async () => {
    typeberryProc = await typeberry();
    minifuzzProc = await minifuzz(directory, steps);

    await minifuzzProc.waitForMessage(/Stopping after.*as requested/);
    console.info('✅ Minifuzz finished');
    await minifuzzProc.cleanExit;
    console.info('✅ Importing successful');
  });
});
}
