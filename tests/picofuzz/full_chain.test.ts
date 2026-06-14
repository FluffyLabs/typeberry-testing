import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-full-chain-data/chain-100k";

runPicofuzzTest("full_chain", EXAMPLES_DIR, {
  repeat: 1,
  flavour: "full",
  memory: "4096m",
  noLogs: true,
  // STF is ~25ms/message, but per-message overhead dominates wall-clock and
  // scales with the runner. Sized for the dedicated non-perf machine, under the
  // workflow's 240-min job cap.
  timeoutMs: 210 * 60 * 1000,
});
