import { describe, it } from "node:test";
import { ExternalProcess } from "./external-process.js";

const TEST_TIMEOUT = 3 * 60 * 1_000;

describe("NPM published next version works", { timeout: TEST_TIMEOUT }, () => {
  it("should display help", async () => {
    const proc = ExternalProcess.spawn("npm/npx", "npx", "-y", "@typeberry/jam@next", "--help").terminateAfter(
      TEST_TIMEOUT,
    );

    await proc.waitForMessage(/typeberry\/jam.*by Fluffy Labs/);
  });
});
