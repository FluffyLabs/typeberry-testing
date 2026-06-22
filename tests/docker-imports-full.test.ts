import { describe, it } from "node:test";
import { CI_LABEL, killContainer, registerContainer, TYPEBERRY_IMAGE, uniqueContainerName } from "./common.js";
import { ExternalProcess } from "./external-process.js";

// Full import wall-clock depends heavily on the runner: ~70 min on a fast idle
// box, far longer on a shared/contended one. A scheduled run in 2026-06 reached
// only ~block 83k/100k within 210 min (≈250 min projected for the full chain),
// so this is sized well above that. Kept under the workflow's 390-min job cap so
// the test self-aborts and reaps its container before GitHub hard-kills the job.
const TEST_TIMEOUT = 360 * 60 * 1_000;

// The dump holds blocks for time slots 0..100051; typeberry logs the slot of
// the best block, so reaching the last block prints `Best: #100051`
// (`Best block: #100051` on typeberry versions before the importer log rename).
const LAST_SLOT = 100051;

describe("Docker image can import the full-chainspec block dump", { timeout: TEST_TIMEOUT }, () => {
  it("should import the chain-100k blocks", async () => {
    const containerName = uniqueContainerName("import-full");
    registerContainer(containerName);
    const proc = ExternalProcess.spawn(
      "docker",
      "docker",
      "run",
      "--mount",
      "type=bind,src=./block-dumps,dst=/block-dumps,readonly",
      "--rm",
      "--name",
      containerName,
      "--label",
      CI_LABEL,
      TYPEBERRY_IMAGE,
      "--config=default",
      '--config=.flavor="full"',
      "--config=.chain_spec=/block-dumps/full/chain-spec-full.json",
      "import",
      "/block-dumps/full/chain-100k.bin",
    )
      .terminateAfter(TEST_TIMEOUT)
      .onTerminate(() => killContainer(containerName));

    await proc.waitForMessage(new RegExp(`Best(?: block)?: #${LAST_SLOT}`));
  });
});
