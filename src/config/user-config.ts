import * as fs from 'fs';
import * as yaml from 'js-yaml';

//
// configuration (possibly) located in user HOME folder
//

export interface UserConfigStruct {
  dosboxWrapper: {
    paths?: {
      bin?: string;
    };
  };
}

export class UserConfig {
  private config: UserConfigStruct | undefined;

  public get binPath(): string | undefined {
    return this.config?.dosboxWrapper?.paths?.bin;
  }

  public async load(filePath: string): Promise<void> {
    const ymlContent = await fs.promises.readFile(filePath, 'utf-8');
    this.config = yaml.load(ymlContent) as UserConfigStruct;
  }
}
