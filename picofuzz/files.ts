import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function getBinFiles(directory: string): Promise<string[]> {
  const files = await fs.readdir(directory);
  const binFiles: string[] = [];

  for (const file of files) {
    if (file.endsWith('.bin')) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        binFiles.push(filePath);
      }
    }
  }

  return binFiles;
}

export async function processFile(filePath: string, doProcess: (filePath: string, fileData: Buffer) => Promise<boolean>): Promise<boolean> {
  try {
    const fileData = await fs.readFile(filePath);

    const v = await doProcess(filePath, fileData);
    if (v) {
      console.log(`Successfully processed: ${filePath}`);
    }
    return v;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

