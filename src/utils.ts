import fs from 'node:fs';
import os from 'node:os';

export class DBWError extends Error {
  public constructor(message: string) {
    super(message);
  }
}

export namespace Utils {
  export async function fileExists(filePath: string): Promise<boolean> {
    try {
      const stats: fs.Stats = await fs.promises.stat(filePath);
      return stats.isFile();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Object.prototype.hasOwnProperty.call(error, 'code') && (error as any).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  export async function directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats: fs.Stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Object.prototype.hasOwnProperty.call(error, 'code') && (error as any).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  export async function appendFile(filePath: string, content: string): Promise<void> {
    const lines: string[] = content.split(os.EOL);
    return fs.promises.appendFile(filePath, lines.map(l => l.trim()).join(os.EOL));
  }
}
