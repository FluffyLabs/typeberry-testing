import { execSync } from "node:child_process";
import { ExternalProcess } from "./external-process.js";

const SOCKET_PATH = "/shared/jam_target.sock";
const SHARED_VOLUME = "jam-ipc-volume";

const DOCKER_OPTIONS = (mem = "512m") => [
  "--cpu-shares",
  "2048",
  "--cpu-quota",
  "-1",
  "--memory",
  mem,
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
  "--stop-signal=SIGKILL",
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
  timeout,
  dockerArgs = [],
  sharedVolume = SHARED_VOLUME,
  options = {},
}: {
  timeout: number;
  dockerArgs?: string[];
  sharedVolume?: string;
  options?: { highMemory?: boolean; initGenesisFromAncestry?: boolean };
}) {
  const typeberry = ExternalProcess.spawn(
    "typeberry",
    "docker",
    "run",
    "--rm",
    ...dockerArgs,
    ...DOCKER_OPTIONS(options.highMemory ? "2048m" : "512m"),
    "-v",
    `${sharedVolume}:/shared`,
    "ghcr.io/fluffylabs/typeberry:latest",
    "fuzz-target",
    ...(options.initGenesisFromAncestry === true ? ["--init-genesis-from-ancestry"] : []),
    SOCKET_PATH,
  ).terminateAfter(timeout - 30_000);
  await typeberry.waitForMessage(/IPC server is listening/);
  return typeberry;
}

export async function minifuzz({
  dir,
  stopAfter = 20,
  sharedVolume = SHARED_VOLUME,
  timeout,
}: {
  dir: string;
  stopAfter?: number;
  sharedVolume?: string;
  timeout: number;
}) {
  return ExternalProcess.spawn(
    "minifuzz",
    "docker",
    "run",
    "--rm",
    "-v",
    `${process.cwd()}/picofuzz-conformance-data:/app/picofuzz-conformance-data:ro`,
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
  ).terminateAfter(timeout - 10_000);
}

export async function picofuzz({
  dir,
  repeat = 1,
  sharedVolume = SHARED_VOLUME,
  timeout,
  statsFile,
}: {
  dir: string;
  repeat?: number;
  sharedVolume?: string;
  timeout: number;
  statsFile?: string;
}) {
  return ExternalProcess.spawn(
    "picofuzz",
    "docker",
    "run",
    "--rm",
    "-v",
    `${process.cwd()}/picofuzz-stf-data:/app/picofuzz-stf-data:ro`,
    "-v",
    `${process.cwd()}/picofuzz-conformance-data:/app/picofuzz-conformance-data:ro`,
    "-v",
    `${process.cwd()}/picofuzz-result:/app/picofuzz-result`,
    "-v",
    `${sharedVolume}:/shared`,
    "picofuzz",
    ...(statsFile ? [`--stats=/app/picofuzz-result/${statsFile}`] : []),
    `--repeat=${repeat}`,
    `/app/${dir}`,
    SOCKET_PATH,
  ).terminateAfter(timeout - 10_000);
}
