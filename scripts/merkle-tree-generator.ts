import { parse } from "csv-parse";
import { parseUnits, solidityPacked } from "ethers";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";
import { createReadStream } from "node:fs";
import { resolve } from "node:path";

const filePath: string = resolve("data", "records.csv");
type RecordType = { address: string; amount: string };

async function generateMerkleTree(): Promise<MerkleTree> {
  const parser = parse({ columns: true }) as unknown as NodeJS.ReadWriteStream;
  const records: RecordType[] = [];

  return new Promise((resolve, reject) => {
    parser.on("readable", () => {
      let record: string | Buffer;
      while ((record = parser.read())) {
        records.push(record as unknown as RecordType);
      }
    });

    parser.on("error", (err) => {
      console.error(`Error parsing file ${filePath}`);
      reject(err);
    });

    parser.on("end", () => {
      console.info(`Finished parsing file ${filePath}`);

      const parsedRecords = records.map((i) => [
        i.address,
        parseUnits(i.amount, 18),
      ]);

      const leaves = parsedRecords.map((record) =>
        keccak256(solidityPacked(["address", "uint256"], record))
      );

      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      resolve(tree);
    });

    const fileStream = createReadStream(filePath);
    fileStream.pipe(parser);
  });
}

export async function generateMerkleProof(
  address: string,
  amount: string
): Promise<string[]> {
  const tree = await generateMerkleTree();

  const leaf = keccak256(
    solidityPacked(["address", "uint256"], [address, parseUnits(amount, 18)])
  );

  return tree.getHexProof(leaf);
}

export async function getMerkleRoot(): Promise<string> {
  const tree = await generateMerkleTree();
  return tree.getHexRoot();
}
