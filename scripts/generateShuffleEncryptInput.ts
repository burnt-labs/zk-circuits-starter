import { buildBabyjub } from "circomlibjs";
import * as fs from "fs";
const { Scalar } = require("ffjavascript");

// --- Configuration ---
const NUM_CARDS = 5; // Must match your circuit template parameter
const OUTPUT_FILE = "inputs/ShuffleEncryptV2/default.json";

async function generateInput() {
  console.log("Initializing BabyJubjub...");
  const babyjub = await buildBabyjub();
  const F = babyjub.F;

  // Helper: Convert Field Element to String
  const FtoS = (x: any) => Scalar.fromRprLE(F.fromMontgomery(x)).toString();

  // Helper: Compress Point Logic (matches the ecDecompress circuit logic)
  // Logic: If y < P/2, then s=1, delta=y. 
  //        If y > P/2, then s=0, delta=-y (which is P-y).
  // Note: The circuit says: y = s*delta + (s-1)*delta
  //       If s=1 -> y = delta. If s=0 -> y = -delta.
  const compressPoint = (point: any[]) => {
    const x = point[0];
    let y = point[1];

    // Check if y is "negative" (larger than half the field modulus)
    // The prime q of BabyJub scalar field
    const q = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    const y_big = Scalar.fromString(FtoS(y));
    const half_q = Scalar.shiftRight(q, 1);

    let delta, s;

    if (Scalar.lt(y_big, half_q)) {
      // Positive case
      s = 1;
      delta = y;
    } else {
      // Negative case (y is effectively -delta)
      s = 0;
      delta = F.neg(y);
    }

    return {
      x: FtoS(x),
      delta: FtoS(delta),
      s: s
    };
  };

  // 1. Setup Keys
  // In real life, this is the Aggregate Public Key of the mixnet
  const sk = Scalar.fromString("123456789"); // Random secret
  const pkPoint = babyjub.mulPointEscalar(babyjub.Base8, sk);

  // 2. Generate Input Deck (U)
  // We create random messages (points) and "encrypt" them initially
  // U = (r*G, r*PK + M)
  const deck_U_C0_points: any[] = [];
  const deck_U_C1_points: any[] = [];

  // Randomness for initial encryption
  const initial_r = Scalar.fromString("111");

  console.log(`Generating ${NUM_CARDS} encrypted cards...`);
  for (let i = 0; i < NUM_CARDS; i++) {
    // Message M (Mapped to curve, simplified here as i * Base8)
    const M = babyjub.mulPointEscalar(babyjub.Base8, i + 1);

    // C0 = r * G
    const C0 = babyjub.mulPointEscalar(babyjub.Base8, initial_r);
    // C1 = r * PK + M
    const sharedSecret = babyjub.mulPointEscalar(pkPoint, initial_r);
    const C1 = babyjub.addPoint(sharedSecret, M);

    deck_U_C0_points.push(C0);
    deck_U_C1_points.push(C1);
  }

  // 3. Create Shuffle Permutation (A)
  // We create a simple mapping, e.g., [0, 1, 2] -> [1, 2, 0]
  // Fisher-Yates shuffle
  const permutation = Array.from({ length: NUM_CARDS }, (_, i) => i);
  for (let i = permutation.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }

  // Create Matrix A (Flattened)
  // A[i][j] = 1 if input j moves to output i
  const A_matrix = new Array(NUM_CARDS * NUM_CARDS).fill(0);
  for (let out_idx = 0; out_idx < NUM_CARDS; out_idx++) {
    const in_idx = permutation[out_idx];
    // Calculate flattened index: row * width + col
    // Row is out_idx, Col is in_idx
    A_matrix[out_idx * NUM_CARDS + in_idx] = 1;
  }

  // 4. Generate Randomness for Re-encryption (R)
  const R_scalars: any[] = [];
  for (let i = 0; i < NUM_CARDS; i++) {
    const randVal = Math.floor(Math.random() * 1000000);
    R_scalars.push(Scalar.fromString(randVal.toString()));
  }

  // 5. Calculate Output Deck (V)
  // V[i] = U[permutation[i]] + Encrypt(R[i])
  const deck_V_C0_points: any[] = [];
  const deck_V_C1_points: any[] = [];

  for (let i = 0; i < NUM_CARDS; i++) {
    const sourceIdx = permutation[i];

    // Get the shuffled card from U
    const old_C0 = deck_U_C0_points[sourceIdx];
    const old_C1 = deck_U_C1_points[sourceIdx];

    // Calculate the re-encryption factor
    const r = R_scalars[i];
    const noise_C0 = babyjub.mulPointEscalar(babyjub.Base8, r);
    const noise_C1 = babyjub.mulPointEscalar(pkPoint, r);

    // Add noise
    const new_C0 = babyjub.addPoint(old_C0, noise_C0);
    const new_C1 = babyjub.addPoint(old_C1, noise_C1);

    deck_V_C0_points.push(new_C0);
    deck_V_C1_points.push(new_C1);
  }

  // 6. Format Data for Circom
  console.log("Formatting data...");

  // Arrays to hold final JSON strings
  const UX0 = [], UX1 = [], UDelta0 = [], UDelta1 = [];
  const VX0 = [], VX1 = [], VDelta0 = [], VDelta1 = [];

  // Sign accumulators (bitmasks)
  let s_u0_bits = 0n;
  let s_u1_bits = 0n;
  let s_v0_bits = 0n;
  let s_v1_bits = 0n;

  // Process Inputs (U)
  for (let i = 0; i < NUM_CARDS; i++) {
    const c0 = compressPoint(deck_U_C0_points[i]);
    const c1 = compressPoint(deck_U_C1_points[i]);

    UX0.push(c0.x);
    UDelta0.push(c0.delta);
    if (c0.s === 1) s_u0_bits += (1n << BigInt(i));

    UX1.push(c1.x);
    UDelta1.push(c1.delta);
    if (c1.s === 1) s_u1_bits += (1n << BigInt(i));
  }

  // Process Outputs (V)
  for (let i = 0; i < NUM_CARDS; i++) {
    const c0 = compressPoint(deck_V_C0_points[i]);
    const c1 = compressPoint(deck_V_C1_points[i]);

    VX0.push(c0.x);
    VDelta0.push(c0.delta);
    if (c0.s === 1) s_v0_bits += (1n << BigInt(i));

    VX1.push(c1.x);
    VDelta1.push(c1.delta);
    if (c1.s === 1) s_v1_bits += (1n << BigInt(i));
  }

  const finalInput = {
    pk: [FtoS(pkPoint[0]), FtoS(pkPoint[1])],
    UX0, UX1,
    VX0, VX1,
    UDelta0, UDelta1,
    VDelta0, VDelta1,
    s_u: [s_u0_bits.toString(), s_u1_bits.toString()],
    s_v: [s_v0_bits.toString(), s_v1_bits.toString()],
    A: A_matrix.map(x => x.toString()),
    R: R_scalars.map(x => x.toString())
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalInput, null, 2));
  console.log(`Done! Input generated at ${OUTPUT_FILE}`);
}

generateInput().catch(console.error);
