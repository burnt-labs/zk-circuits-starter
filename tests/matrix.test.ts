import { describe, it } from 'bun:test'

import { WitnessTester, Circomkit } from "circomkit"
const circomkit = new Circomkit({ verbose: false })

describe("matrix", () => {
  it("should multiply 2x3 matrix with vector", async () => {
    const M = 2,
      N = 3
    const circuit = await circomkit.WitnessTester("matrixMultiplication", {
      file: "matrix",
      template: "matrixMultiplication",
      params: [M, N],
    });
    const INPUT = {
      A: [2, 3, 4, 5, 6, 7], X: [1, 2, 3]
    }
    const OUTPUT = { B: [20, 38] }

    await circuit.expectPass(INPUT, OUTPUT);
  });
});
