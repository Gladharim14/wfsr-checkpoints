# WFSR checkpoints

Every night the World Football Shirt Register ([wfsr.app](https://wfsr.app)) publishes one fingerprint (a Merkle root) over the history of every shirt in the register, signed with WFSR's key and timestamped with [OpenTimestamps](https://opentimestamps.org) in the Bitcoin blockchain.

Once a day is published here, nobody, including WFSR, can change any shirt's history up to that day without it showing: the shirt page would no longer match the published root, and this repository and the timestamp can't be rewritten unnoticed.

What this shows: a shirt's recorded history existed in this form on that date. What it does not show: anything about the shirt itself. WFSR records what members report; it never says a shirt is original.

## Files

- `roots/<day>.json`: day, number of shirts, root, Ed25519 signature.
- `roots/<day>.json.ots`: the OpenTimestamps proof for that file.
- `public-key.txt`: WFSR's public key (raw Ed25519, base64). The same key is built into wfsr.app.
- `merkle.mjs`, `verify.mjs`: the format and a checker, plain Node with no dependencies.

## Check it yourself

1. On a public shirt page, open **Verify it yourself**. Your browser repeats the checks below. Tap **Download proof** for the file.
2. With Node 20+: `node verify.mjs roots/<day>.json proof.json`
3. The timestamp: `pip install opentimestamps-client`, then `ots verify roots/<day>.json.ots`.

## Format (version 1)

```
leaf = sha256("WFSR-LEAF-1|" + public_id + "|" + entries + "|" + last_fingerprint)
node = sha256("WFSR-NODE-1|" + left + "|" + right)      (an odd last node moves up unchanged)
root over all leaves sorted by public_id; empty register = sha256("WFSR-EMPTY-1")
signed message = "WFSR-CHECKPOINT-1|" + day + "|" + leaves + "|" + root
```

`last_fingerprint` is the hash of the shirt's newest history entry; each entry's hash includes the one before it, so the leaf fixes the whole history up to that entry. Shirts deleted before anyone else ever saw them may disappear from later checkpoints.
