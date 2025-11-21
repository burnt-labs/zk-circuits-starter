import { buildBabyjub } from "circomlibjs";
import { randomBytes } from "crypto";
const Scalar = require("ffjavascript").Scalar;
import { ecCompress } from '@zk-shuffle/proof/src/shuffle/utilities';
import fs from 'fs';


async function generateInput() {
  const babyjub = await buildBabyjub();
  let ic0 = babyjub.mulPointEscalar(babyjub.Base8, 0);
  let ic1 = babyjub.mulPointEscalar(babyjub.Base8, 8);
  let sk = 5n;
  let pk = babyjub.mulPointEscalar(babyjub.Base8, sk);
  let r = 86n;

  const INPUT = {
    ic0: [
      Scalar.fromRprLE(babyjub.F.fromMontgomery(ic0[0])).toString(),
      Scalar.fromRprLE(babyjub.F.fromMontgomery(ic0[1])).toString(),
    ],
    ic1: [
      Scalar.fromRprLE(babyjub.F.fromMontgomery(ic1[0])).toString(),
      Scalar.fromRprLE(babyjub.F.fromMontgomery(ic1[1])).toString(),
    ],
    r: r.toString(),
    pk: [
      Scalar.fromRprLE(babyjub.F.fromMontgomery(pk[0])).toString(),
      Scalar.fromRprLE(babyjub.F.fromMontgomery(pk[1])).toString(),
    ],
  }
  console.log(INPUT)

  fs.writeFileSync('inputs/elgamal/default.json', JSON.stringify(INPUT, null, 2));



}

generateInput();



