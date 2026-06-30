import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { ExternalProcess } from "./external-process.js";

const SOCKET_PATH = "/shared/jam_target.sock";
const SHARED_VOLUME = "jam-ipc-volume";

// Tag every docker resource we create so the workflow-level post-step can
// reliably reap survivors even when the test process is SIGKILL'd.
const CI_RUN_ID = process.env.GITHUB_RUN_ID ?? "local";
export const CI_LABEL = `ci-run=${CI_RUN_ID}`;

export function uniqueContainerName(prefix: string) {
  return `tb-${prefix}-${CI_RUN_ID}-${randomBytes(4).toString("hex")}`;
}

// Containers we created in this process. Drained by the signal/exit handlers
// below so an interrupted node run doesn't leave the docker daemon babysitting
// our containers.
const trackedContainers = new Set<string>();

export function registerContainer(name: string) {
  trackedContainers.add(name);
}

export function killContainer(name: string) {
  try {
    execSync(`docker rm -f ${name}`, { stdio: "ignore" });
  } catch {
    // Container may already be gone (--rm fired, or never started). That's fine.
  }
  trackedContainers.delete(name);
}

function reapAllTrackedSync() {
  for (const name of trackedContainers) {
    try {
      execSync(`docker rm -f ${name}`, { stdio: "ignore" });
    } catch {}
  }
  trackedContainers.clear();
}

process.on("exit", reapAllTrackedSync);
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
  process.on(sig, () => {
    reapAllTrackedSync();
    // Once a signal handler is registered Node skips the default exit, so do it
    // ourselves. The reap above already drained tracked containers; the "exit"
    // handler firing a second time is a harmless no-op.
    process.exit(1);
  });
}

/**
 * Docker image under test. Defaults to the locally-provisioned `typeberry:test`
 * (built/fetched by the provision-typeberry action). Set TYPEBERRY_IMAGE to
 * override (e.g. pr-benchmark tags its loaded artifact `typeberry:test`).
 */
export const TYPEBERRY_IMAGE = process.env.TYPEBERRY_IMAGE ?? "typeberry:test";

const STATE_BACKEND = process.env.STATE_BACKEND ?? "";

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
  execSync(`docker volume create --label ${CI_LABEL} ${volumeName}`);

  // Initialize the volume with proper permissions
  const initName = uniqueContainerName("volinit");
  trackedContainers.add(initName);
  try {
    execSync(
      `docker run --rm --name ${initName} --label ${CI_LABEL} -v ${volumeName}:/shared alpine sh -c "mkdir -p /shared && chmod 777 /shared"`,
    );
  } finally {
    trackedContainers.delete(initName);
  }

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
  options?: {
    highMemory?: boolean;
    memory?: string;
    initGenesisFromAncestry?: boolean;
    flavor?: "tiny" | "full";
    inMemory?: boolean;
  };
}) {
  const containerName = uniqueContainerName("typeberry");
  trackedContainers.add(containerName);
  if (STATE_BACKEND && !options.inMemory) {
    dockerArgs = [...dockerArgs, "-e", `JAM_FUZZ_DB=${STATE_BACKEND}-hybrid`];
  }
  const typeberry = ExternalProcess.spawn(
    "typeberry",
    "docker",
    "run",
    "--rm",
    "--name",
    containerName,
    "--label",
    CI_LABEL,
    ...dockerArgs,
    ...DOCKER_OPTIONS(options.memory ?? (options.highMemory ? "2048m" : "512m")),
    "-v",
    `${sharedVolume}:/shared`,
    TYPEBERRY_IMAGE,
    ...(options.flavor === "full" ? ["--config=default", '--config=.flavor="full"'] : []),
    "fuzz-target",
    ...(options.initGenesisFromAncestry === true ? ["--init-genesis-from-ancestry"] : []),
    SOCKET_PATH,
  )
    .terminateAfter(timeout - 30_000)
    .onTerminate(() => killContainer(containerName));
  await typeberry.waitForMessage(/PVM Backend/);
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
  const containerName = uniqueContainerName("minifuzz");
  trackedContainers.add(containerName);
  return ExternalProcess.spawn(
    "minifuzz",
    "docker",
    "run",
    "--rm",
    "--name",
    containerName,
    "--label",
    CI_LABEL,
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
  )
    .terminateAfter(timeout - 10_000)
    .onTerminate(() => killContainer(containerName));
}

/**
 * picofuzz exits successfully on an empty directory, so a missing dataset
 * (e.g. an uninitialized data submodule) would silently pass the test.
 * Call this before spawning any containers.
 */
export function assertDatasetPresent(dir: string) {
  const binFiles = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".bin")) : [];
  if (binFiles.length === 0) {
    throw new Error(`No .bin files found in ${dir} — is the data submodule checked out?`);
  }
}

export async function picofuzz({
  dir,
  repeat = 1,
  sharedVolume = SHARED_VOLUME,
  timeout,
  statsFile,
  ignore = [],
  flavour = "tiny",
}: {
  dir: string;
  repeat?: number;
  sharedVolume?: string;
  timeout: number;
  statsFile?: string;
  ignore?: string[];
  flavour?: "tiny" | "full";
}) {
  assertDatasetPresent(dir);
  const containerName = uniqueContainerName("picofuzz");
  trackedContainers.add(containerName);
  return ExternalProcess.spawn(
    "picofuzz",
    "docker",
    "run",
    "--rm",
    "--name",
    containerName,
    "--label",
    CI_LABEL,
    "-v",
    `${process.cwd()}/picofuzz-stf-data:/app/picofuzz-stf-data:ro`,
    "-v",
    `${process.cwd()}/picofuzz-conformance-data:/app/picofuzz-conformance-data:ro`,
    "-v",
    `${process.cwd()}/picofuzz-full-chain-data:/app/picofuzz-full-chain-data:ro`,
    "-v",
    `${process.cwd()}/picofuzz-result:/app/picofuzz-result`,
    "-v",
    `${sharedVolume}:/shared`,
    "picofuzz",
    ...(statsFile ? [`--stats=/app/picofuzz-result/${statsFile}`] : []),
    ...ignore.flatMap((f) => ["--ignore", f]),
    `--flavour=${flavour}`,
    `--repeat=${repeat}`,
    `/app/${dir}`,
    SOCKET_PATH,
  )
    .terminateAfter(timeout - 10_000)
    .onTerminate(() => killContainer(containerName));
}
