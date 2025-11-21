import { buildBabyjub } from "circomlibjs";
import { randomBytes } from "crypto";
const Scalar = require("ffjavascript").Scalar;
import { ecCompress } from '@zk-shuffle/proof/src/shuffle/utilities';


async function generateRandomBabyJubJubPoint() {
  const babyjub = await buildBabyjub();
  let ecPoint = babyjub.mulPointEscalar(babyjub.Base8, 5);
  let compressedPoint = ecCompress([
    Scalar.fromRprLE(babyjub.F.fromMontgomery(ecPoint[0])),
    Scalar.fromRprLE(babyjub.F.fromMontgomery(ecPoint[1])),
  ]);
  const INPUT = { x: compressedPoint.xArr[0], delta: compressedPoint.deltaArr[0], s: compressedPoint.selector }
  console.log(INPUT)

  

}

generateRandomBabyJubJubPoint();
