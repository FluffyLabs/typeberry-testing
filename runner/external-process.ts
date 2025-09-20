import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { promises, setTimeout } from "node:timers";

const SHUTDOWN_GRACE_PERIOD = 5_000;

export class ExternalProcess {
  static spawn(processName: string, command: string, ...args: string[]) {
    console.log(`Spawning ${processName}: "${command} ${args.join(' ')}"`);
    const spawned = spawn(command, args, {
      cwd: process.cwd(),
      shell: true,
    });
    spawned.stdout.on('data', (data: Buffer) => {
      console.info(`[${processName}] ${data.toString()}`);
    });
    spawned.stderr.on('data', (data: Buffer) => {
      console.error(`[${processName}] ${data.toString()}`);
    });
    return new ExternalProcess(processName, spawned);
  }

  public readonly cleanExit: Promise<void>;

  private constructor(
    private readonly processName: string,
    private readonly spawned: ChildProcessWithoutNullStreams,
  ) {
    this.cleanExit = new Promise((resolve, reject) => {
      spawned.on("error", (err) => {
        reject(`[${this.processName}] Failed to start process: ${err.message}`);
      });

      spawned.on("exit", (code, signal) => {
        if (code === 0) {
          resolve();
        } else {
          reject(`[${this.processName}] Process exited (code: ${code}, signal: ${signal})`);
        }
      });
    });
  }

  async waitForMessage(pattern: RegExp, check: (match: RegExpMatchArray) => boolean = () => true) {
    return new Promise<string>((resolve, reject) => {
      this.spawned.on('exit', () => reject('Exited'));
      this.spawned.on('error', () => reject('Error'));
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
      console.warn('Process already terminated. Ignoring.');
    }

    console.log("Terminating process.");
    const grace = promises.setTimeout(SHUTDOWN_GRACE_PERIOD);
    this.spawned.kill("SIGINT");
    this.spawned.stdin?.end();
    this.spawned.stdout?.destroy();
    this.spawned.stderr?.destroy();
    await grace;
    console.error("Process shutdown timing out. Killing");
    this.spawned.kill("SIGKILL");
  }

  terminateAfter(timeoutMs: number) {
    const timeout = setTimeout(() => {
      console.error("Test timing out, terminating the process.");
      this.terminate();
    }, timeoutMs);
    this.spawned.on("exit", () => {
      clearTimeout(timeout);
    });
    return this;
  }
}
