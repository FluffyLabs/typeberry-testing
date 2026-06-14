import { runPicofuzzTest } from "./common.js";

const EXAMPLES_DIR = "picofuzz-conformance-data/picofuzz-data";
// NOTE [ToDr] conformance test vectors don't have a valid genesis header, so we need to fake it from ancestry
// data.
runPicofuzzTest("conformance", EXAMPLES_DIR, {
  initGenesisFromAncestry: true,
  repeat: 1,
  noLogs: true,
  ignore: [],
  highMemory: true,
  // Run with a pure in-memory state db. Conformance re-initializes genesis state
  // on every vector, which is pathologically slow on the on-disk fuzz db (the
  // genesis reset re-opens/wipes the keyspace each time) — the on-disk fjall
  // backend pushed this suite past its timeout. State roots don't depend on the
  // storage backend, so in-memory keeps conformance correct and fast.
  inMemory: true,
});
