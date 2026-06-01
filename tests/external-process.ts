import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { setTimeout } from "node:timers";

export class ExternalProcess {
  static spawn(processName: string, command: string, ...args: string[]) {
    console.log(`Spawning ${processName}: "${command} ${args.join(" ")}"`);
    const spawned = spawn(command, args, {
      cwd: process.cwd(),
    });
    spawned.stdout.on("data", (data: Buffer) => {
      console.info(`[${processName}] ${data.toString()}`);
    });
    spawned.stderr.on("data", (data: Buffer) => {
      console.error(`[${processName}] ${data.toString()}`);
    });
    return new ExternalProcess(processName, spawned);
  }

  public readonly cleanExit: Promise<void>;
  private readonly cleanupCallbacks: Array<() => void | Promise<void>> = [];
  private cleanupPromise: Promise<void> | null = null;
  // Set by terminate() so the exit handler knows non-zero exits are expected.
  // Without this, `docker rm -f` from cleanup makes the docker CLI exit with
  // code 137 (container SIGKILL'd) instead of signal=SIGKILL, and the previous
  // exception list misses that case.
  private isTerminating = false;

  private constructor(
    private readonly processName: string,
    private readonly spawned: ChildProcessWithoutNullStreams,
  ) {
    this.cleanExit = new Promise((resolve, reject) => {
      spawned.on("error", (err) => {
        reject(`[${this.processName}] Failed to start process: ${err.message}`);
      });

      spawned.on("exit", (code, signal) => {
        // Fire cleanup hooks on any exit path (clean or otherwise) so e.g.
        // docker containers don't outlive the CLI process that spawned them.
        // Store the promise so terminate() can await it rather than racing.
        this.cleanupPromise = this.runCleanup();
        if (code === 0) {
          resolve();
        } else if (this.isTerminating) {
          console.error(`[${this.processName}] Process exited during termination (code: ${code}, signal: ${signal}).`);
          resolve();
        } else if (code !== 143 && signal !== "SIGTERM" && signal !== "SIGKILL" && signal !== "SIGPIPE") {
          reject(`[${this.processName}] Process exited (code: ${code}, signal: ${signal})`);
        } else {
          console.error(`[${this.processName}] Process had to be killed.`);
          resolve();
        }
      });
    });
  }

  onTerminate(fn: () => void | Promise<void>) {
    this.cleanupCallbacks.push(fn);
    return this;
  }

  private async runCleanup() {
    const pending = this.cleanupCallbacks.splice(0);
    for (const cb of pending) {
      try {
        await cb();
      } catch (err) {
        console.error(`[${this.processName}] cleanup hook failed:`, err);
      }
    }
  }

  async waitForMessage(pattern: RegExp, check: (match: RegExpMatchArray) => boolean = () => true) {
    return new Promise<string>((resolve, reject) => {
      this.spawned.on("exit", () => reject("Exited"));
      this.spawned.on("error", () => reject("Error"));
      this.spawned.stdout.on("data", (data: Buffer) => {
        const output = data.toString();

        const match = pattern.exec(output);
        if (match !== null) {
          if (check(match)) {
            resolve(output);
          }
        }
      });
    });
  }

  async terminate() {
    if (this.spawned.killed) {
      console.warn("Process already terminated. Ignoring.");
    }

    this.isTerminating = true;
    console.log(`[${this.processName}] Terminating`);
    this.spawned.stdin?.end();
    this.spawned.stdout?.destroy();
    this.spawned.stderr?.destroy();
    // Skip the SIGTERM grace period. The docker-wrapped processes we run
    // (typeberry/minifuzz/picofuzz) don't handle SIGTERM — DOCKER_OPTIONS
    // configures `--stop-signal=SIGKILL` precisely because of that. The
    // cleanup hook (`docker rm -f`) reaps the container via the daemon,
    // which propagates as exit code 137 from the `docker run` CLI; the
    // isTerminating flag tells cleanExit to accept that as expected.
    await (this.cleanupPromise ?? this.runCleanup());
    // If no cleanup hook was registered (or it didn't take the process
    // down), SIGKILL the spawned CLI directly so we don't leak it.
    if (this.spawned.exitCode === null && this.spawned.signalCode === null) {
      this.spawned.kill("SIGKILL");
    }
  }

  terminateAfter(timeoutMs: number) {
    const timeout = setTimeout(() => {
      console.error(`[${this.processName}] Test timing out, terminating the process.`);
      this.terminate();
    }, timeoutMs);
    this.spawned.on("exit", () => {
      clearTimeout(timeout);
    });
    return this;
  }
}
