/**
 * Generate an n×n permutation matrix.
 * Each row and each column contains exactly one 1.
 */
export function generatePermutationMatrix(n: number): number[][] {
  if (n <= 0) throw new Error("n must be a positive integer");

  // Step 1: create an array [0,1,2,...,n-1]
  const perm = Array.from({ length: n }, (_, i) => i);

  // Step 2: shuffle it (Fisher–Yates)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }

  // Step 3: convert permutation into a permutation matrix
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let row = 0; row < n; row++) {
    const col = perm[row];
    matrix[row][col] = 1;
  }

  return matrix;
}

// Example
console.log(generatePermutationMatrix(5));
