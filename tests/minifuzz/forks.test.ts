import { runMinifuzzTest } from "./common.js";

const EXAMPLES_DIR = "jam-conformance/fuzz-proto/examples/0.7.2/forks";
runMinifuzzTest("forks", EXAMPLES_DIR, 100);
