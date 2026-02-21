import * as fs from "node:fs";
import * as path from "node:path";

interface CsvEntry {
  key: string;
  line: string;
  projectName: string;
  date: string;
}

interface MergeResult {
  loadedFromRepo: number;
  addedFromArtifacts: number;
  duplicatesSkipped: number;
  totalWritten: number;
}

const PUBLIC_DIR = "./public";
const ARTIFACTS_DIR = "./csv-artifacts";

function parseCsvLine(line: string): CsvEntry | null {
  const parts = line.split(",");
  if (parts.length < 2) {
    return null;
  }
  const projectName = parts[0];
  const date = parts[1];
  const key = `${projectName},${date}`;
  return { key, line, projectName, date };
}

function readCsvFile(filePath: string): Map<string, CsvEntry> {
  const entries = new Map<string, CsvEntry>();

  if (!fs.existsSync(filePath)) {
    return entries;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const entry = parseCsvLine(line);
    if (entry) {
      entries.set(entry.key, entry);
    }
  }

  return entries;
}

function mergeCsvFiles(csvFileName: string, repoDir: string, artifactsDir: string): MergeResult {
  const repoPath = path.join(repoDir, csvFileName);
  const artifactPath = path.join(artifactsDir, csvFileName);

  // Start with repo data
  const entries = readCsvFile(repoPath);
  const loadedFromRepo = entries.size;

  // Merge artifact data
  let addedFromArtifacts = 0;
  let duplicatesSkipped = 0;

  if (fs.existsSync(artifactPath)) {
    const artifactEntries = readCsvFile(artifactPath);

    for (const [key, entry] of artifactEntries) {
      if (entries.has(key)) {
        duplicatesSkipped++;
      } else {
        entries.set(key, entry);
        addedFromArtifacts++;
      }
    }
  }

  // Sort by date and write back
  const sortedEntries = Array.from(entries.values()).sort((a, b) => {
    return a.date.localeCompare(b.date);
  });

  const output = `${sortedEntries.map((e) => e.line).join("\n")}\n`;
  fs.writeFileSync(repoPath, output);

  return {
    loadedFromRepo,
    addedFromArtifacts,
    duplicatesSkipped,
    totalWritten: sortedEntries.length,
  };
}

function getCsvFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir).filter((f) => f.endsWith(".csv"));
}

function main(): void {
  console.log("CSV Merge Tool");
  console.log("==============\n");

  // Get all CSV files from both directories
  const repoCsvs = getCsvFiles(PUBLIC_DIR);
  const artifactCsvs = getCsvFiles(ARTIFACTS_DIR);

  // Get unique CSV filenames
  const allCsvFiles = new Set([...repoCsvs, ...artifactCsvs]);

  console.log("Repository CSVs:", repoCsvs);
  console.log("Artifact CSVs:", artifactCsvs);
  console.log("All CSV files to process:", [...allCsvFiles]);
  console.log();

  for (const csvFile of allCsvFiles) {
    const result = mergeCsvFiles(csvFile, PUBLIC_DIR, ARTIFACTS_DIR);

    console.log(`${csvFile}:`);
    console.log(`  loaded ${result.loadedFromRepo} entries from repo`);
    console.log(
      `  added ${result.addedFromArtifacts} new entries from artifacts, skipped ${result.duplicatesSkipped} duplicates`,
    );
    console.log(`  total ${result.totalWritten} entries written`);
  }

  console.log("\nFinal public directory contents:");
  fs.readdirSync(PUBLIC_DIR).forEach((f) => console.log(`  - ${f}`));
}

main();
