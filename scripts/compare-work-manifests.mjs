import { readFile, writeFile } from 'node:fs/promises';

const previousPath = process.argv[2];
const currentPath = process.argv[3];
const outputPath = process.argv[4];
if (!previousPath || !currentPath || !outputPath) {
  throw new Error('usage: compare-work-manifests.mjs PREVIOUS_JSON CURRENT_JSON OUTPUT_JSON');
}

const readIfPresent = async (path) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
};

const previous = await readIfPresent(previousPath);
const current = await readIfPresent(currentPath);
if (!current?.datasetHash) throw new Error('current work manifest has no datasetHash');

const result = {
  publicDataChanged: !previous?.datasetHash || previous.datasetHash !== current.datasetHash,
  previousDatasetHash: previous?.datasetHash ?? null,
  currentDatasetHash: current.datasetHash,
  counts: current.counts,
};
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  await writeFile(
    process.env.GITHUB_OUTPUT,
    `public_data_changed=${result.publicDataChanged}\ncurrent_dataset_hash=${result.currentDatasetHash}\n`,
    { flag: 'a' },
  );
}
console.log(JSON.stringify(result));
