import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-data/fallback";
runPicofuzzTest("safrole", EXAMPLES_DIR, 10);
