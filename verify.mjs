// Check a WFSR checkpoint yourself. Needs Node 20 or newer, nothing else.
//   node verify.mjs roots/2026-11-05.json              checks the signature of that day's root
//   node verify.mjs roots/2026-11-05.json proof.json   also checks that one shirt is included
// proof.json is the file "Download proof" gives on a shirt page.
// The timestamp: `ots verify roots/2026-11-05.json.ots` (https://opentimestamps.org).
import { createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { leafHash, rootFromProof, signedMessage } from "./merkle.mjs";

const [rootFile, proofFile] = process.argv.slice(2);
if (!rootFile) {
  console.log("usage: node verify.mjs roots/<day>.json [proof.json]");
  process.exit(2);
}
const cp = JSON.parse(readFileSync(rootFile, "utf8"));
const keyB64 = readFileSync(new URL("./public-key.txt", import.meta.url), "utf8").trim();
const key = createPublicKey({
  key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(keyB64, "base64")]),
  format: "der",
  type: "spki",
});
const sigOk = verify(null, Buffer.from(signedMessage(cp.day, cp.leaves, cp.root)), key, Buffer.from(cp.signature, "base64"));
console.log(`${sigOk ? "OK  " : "FAIL"} signature of checkpoint ${cp.day} (${cp.leaves} shirts, root ${cp.root})`);
let ok = sigOk;
if (proofFile) {
  const p = JSON.parse(readFileSync(proofFile, "utf8"));
  const root = rootFromProof(leafHash(p.public_id, p.seq, p.hash), p.proof);
  const inc = root === cp.root && p.day === cp.day;
  console.log(`${inc ? "OK  " : "FAIL"} shirt ${p.public_id}, history entry ${p.seq} (fingerprint ${p.hash}) is in this checkpoint`);
  ok = ok && inc;
}
process.exit(ok ? 0 : 1);
