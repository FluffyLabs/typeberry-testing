import { runMinifuzzTest } from "./common.js";

const EXAMPLES_DIR = "jam-conformance/fuzz-proto/examples/v1/forks";
runMinifuzzTest("forks", EXAMPLES_DIR, 100);
