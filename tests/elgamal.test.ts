import { WitnessTester, Circomkit } from "circomkit"
import { describe, it, beforeAll } from 'bun:test'
import { createHash } from 'crypto'
import { ecCompress } from '@zk-shuffle/proof/src/shuffle/utilities';
import { buildBabyjub } from 'circomlibjs'
const Scalar = require("ffjavascript").Scalar;


const circomkit = new Circomkit({ verbose: false })

describe("ElGamal Encryption and Decryption are correct", async () => {
  const babyjub = await buildBabyjub();
  // console.log(babyjub);

  let circuit: WitnessTester<['ic0', 'ic1', 'r', 'pk'], ['c0', 'c1']>;
  let ecPoint = babyjub.mulPointEscalar(babyjub.Base8, 5);
  let compressedPoint = ecCompress([
    Scalar.fromRprLE(babyjub.F.fromMontgomery(ecPoint[0])),
    Scalar.fromRprLE(babyjub.F.fromMontgomery(ecPoint[1])),
  ]);

  beforeAll(async () => {
    circuit = await circomkit.WitnessTester(`ElGamalEncrypt`, {
      file: 'elgamal',
      template: 'ElGamalEncrypt',
      params: [251, 5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203]
    })
  })

  it('should compute hash correctly', async () => {
    const INPUT = { x: compressedPoint.xArr[0], delta: compressedPoint.deltaArr[0], s: compressedPoint.selector }
    console.log({ a: compressedPoint.selector })
    let expectedY;
    // When selector (s) is 0, the output should be -delta. In the finite field, this is q - delta.
    // When selector (s) is 1, the output should be delta.
    if (compressedPoint.selector === 0n) {
      expectedY = babyjub.F.p - compressedPoint.deltaArr[0];
    } else {
      expectedY = compressedPoint.deltaArr[0];
    }
    const OUTPUT = { y: expectedY }
    await circuit.expectPass(INPUT, OUTPUT)
  })

  it('should pass on correct witness', async () => {
    const INPUT = { x: compressedPoint.xArr[0], delta: compressedPoint.deltaArr[0], s: compressedPoint.selector }
    const witness = await circuit.calculateWitness(INPUT);
    await circuit.expectConstraintPass(witness);
  })

  it('should fail on fake witness', async () => {
    const INPUT = { x: compressedPoint.xArr[0], delta: compressedPoint.deltaArr[0], s: compressedPoint.selector }
    const witness = await circuit.calculateWitness(INPUT);
    const badWitness = await circuit.editWitness(witness, {
      'main.sha256.sha256compression[0].sigmaPlus[38].sigma0.out[1]': BigInt(1234),
      'main.sha256.sha256compression[0].sigmaPlus[38].sigma0.out[2]': BigInt(1234),
      'main.sha256.sha256compression[0].sigmaPlus[38].sigma0.out[3]': BigInt(1234),
      'main.sha256.sha256compression[0].sigmaPlus[38].sigma0.out[4]': BigInt(1234),
      'main.sha256.sha256compression[0].sigmaPlus[38].sigma0.out[5]': BigInt(1234),
    })
    await circuit.expectConstraintFail(badWitness);
  })


})
