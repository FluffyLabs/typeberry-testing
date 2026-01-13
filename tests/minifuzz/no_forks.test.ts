import { runMinifuzzTest } from "./common.js";

const EXAMPLES_DIR = "jam-conformance/fuzz-proto/examples/0.7.2/no_forks";
runMinifuzzTest("no_forks", EXAMPLES_DIR, 100, { highMemory: true });
