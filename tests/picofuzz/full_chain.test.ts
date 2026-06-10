import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-full-chain-data/chain-100k";

runPicofuzzTest("full_chain", EXAMPLES_DIR, {
  repeat: 1,
  flavour: "full",
  memory: "4096m",
  noLogs: true,
  timeoutMs: 90 * 60 * 1000,
});
