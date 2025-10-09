import { runPicofuzzTest } from "./common.js";

console.log('WORKDIR', process.cwd());

const EXAMPLES_DIR = "picofuzz-data/fallback";
runPicofuzzTest("fallback", EXAMPLES_DIR, 10);
