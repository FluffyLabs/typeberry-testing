import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-conformance-data/picofuzz-data";
// NOTE [ToDr] conformance test vectors don't have a valid genesis header, so we need to fake it from ancestry
// data.
runPicofuzzTest("conformance", EXAMPLES_DIR, {
  initGenesisFromAncestry: true,
  repeat: 1,
  noLogs: true,
  // ignored because of incompatible ticketattempt encoding
  ignore: ["00000102.bin", "00000103.bin", "00000331.bin"],
});
