# ZK Circuits Starter

## Project Description

This project serves as a development and testing ground for Circom-based zero-knowledge circuits. It is specifically configured for the `groth16` proving system on the `bn128` curve. The primary focus of this project is to facilitate rapid prototyping and iteration of ZK circuits.

## Installation

Simply do:

```sh
bun install
```

## Usage

You can see an example within [`src/index.ts`](./src/index.ts). Run it with:

```sh
bun start
```

For the CLI, you can test the entire flow as follows:

1. Compile circuit: `bunx circomkit compile sha256_32`
2. Prove with default input: `bunx circomkit prove sha256_32 default`
3. Verify the proof: `bunx circomkit verify sha256_32 default`
4. Create contract: `bunx circomkit contract sha256_32`
5. Create calldata: `bunx circomkit calldata sha256_32 default`
6. Circuit specific setup `bunx circomkit setup <circuit> [ptau-path]`

Notice that we use `bunx` instead of `npx` to use Bun!

## Testing

Run tests with:

```sh
bun test
```

# References

- [Circom kit: A testing and development environment for Circom](https://github.com/erhant/circomkit)
