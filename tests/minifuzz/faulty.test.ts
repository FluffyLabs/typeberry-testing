import { runMinifuzzTest } from "./common.js";

const EXAMPLES_DIR = 'jam-conformance/fuzz-proto/examples/v1/faulty';
runMinifuzzTest('faulty', EXAMPLES_DIR, 28);
