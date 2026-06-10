import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-full-chain-data/chain-100k";

runPicofuzzTest("full_chain", EXAMPLES_DIR, {
  repeat: 1,
  flavour: "full",
  memory: "4096m",
  noLogs: true,
  // ~56ms/message was observed for this dataset, so a full run takes ~95 minutes.
  timeoutMs: 150 * 60 * 1000,
});
