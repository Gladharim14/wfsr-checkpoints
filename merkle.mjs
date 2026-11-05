// WFSR checkpoint format, version 1 (D-37). Kept dependency-free so anyone can check a checkpoint with plain Node.
import { createHash } from "node:crypto";

export const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

export const leafHash = (publicId, seq, hash) => sha256(`WFSR-LEAF-1|${publicId}|${seq}|${hash}`);
export const nodeHash = (left, right) => sha256(`WFSR-NODE-1|${left}|${right}`);
export const EMPTY_ROOT = sha256("WFSR-EMPTY-1");
export const signedMessage = (day, leaves, root) => `WFSR-CHECKPOINT-1|${day}|${leaves}|${root}`;

/** Leaves sorted by public id. Returns every level, leaves first. An odd last node moves up unchanged. */
export function levels(leafHashes) {
  const out = [leafHashes];
  while (out[out.length - 1].length > 1) {
    const cur = out[out.length - 1];
    const next = [];
    for (let i = 0; i < cur.length; i += 2) next.push(i + 1 < cur.length ? nodeHash(cur[i], cur[i + 1]) : cur[i]);
    out.push(next);
  }
  return out;
}

export const rootOf = (leafHashes) => (leafHashes.length ? levels(leafHashes).at(-1)[0] : EMPTY_ROOT);

/** Steps from a leaf to the root: each step names the sibling and which side it sits on. */
export function proofFor(lv, index) {
  const steps = [];
  let i = index;
  for (let l = 0; l < lv.length - 1; l++) {
    const cur = lv[l];
    if (i % 2 === 1) steps.push({ side: "L", hash: cur[i - 1] });
    else if (i + 1 < cur.length) steps.push({ side: "R", hash: cur[i + 1] });
    i = Math.floor(i / 2);
  }
  return steps;
}

export function rootFromProof(leaf, steps) {
  return steps.reduce((h, s) => (s.side === "L" ? nodeHash(s.hash, h) : nodeHash(h, s.hash)), leaf);
}

export const sortLeaves = (leaves) =>
  [...leaves].sort((a, b) => (a.public_id < b.public_id ? -1 : a.public_id > b.public_id ? 1 : 0));
