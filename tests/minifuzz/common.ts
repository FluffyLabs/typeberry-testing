import { ExternalProcess } from "../../runner/external-process.js";

export const TEST_TIMEOUT = 60_000;
const SOCKET_PATH = '/tmp/jam_target.sock';

export async function typeberry() {
  const typeberry = ExternalProcess
    .spawn(
      "typeberry-multi",
      "docker",
      "run",
      "--rm",
      "-v", "/tmp:/tmp",
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
      "-v", "/tmp:/tmp",
      "minifuzz",
      "--trace-dir", `/app/${dir}`,
      "--target-sock", SOCKET_PATH,
      "--stop-after", `${stopAfter}`,
      "--spec", "tiny"
    )
    .terminateAfter(TEST_TIMEOUT - 10_000);
}
