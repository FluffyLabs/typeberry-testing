import { runMinifuzzTest } from "./common.js";

const EXAMPLES_DIR = 'jam-conformance/fuzz-proto/examples/v1/no_forks';
runMinifuzzTest('no_forks', EXAMPLES_DIR, 100);
