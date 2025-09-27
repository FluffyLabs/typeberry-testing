import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-data/fallback";
runPicofuzzTest("fallback", EXAMPLES_DIR, 10);
