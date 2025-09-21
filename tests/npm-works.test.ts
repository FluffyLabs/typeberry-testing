import { describe, it } from "node:test";
import { ExternalProcess } from "../runner/external-process.js";

const TEST_TIMEOUT = 10_000;

describe("NPM published version works", { timeout: TEST_TIMEOUT }, () => {
  it("should display help", async () => {
    const proc = ExternalProcess.spawn("npm/npx", "npx", "@typeberry/jam", "--help").terminateAfter(TEST_TIMEOUT);

    await proc.waitForMessage(/typeberry\/jam.*by Fluffy Labs/);
  });
});
