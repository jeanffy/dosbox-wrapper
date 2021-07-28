import * as fs from 'fs';
import * as yaml from 'js-yaml';

//
// configuration (possibly) located in user HOME folder
//

export interface UserDosboxConf {
  [key: string]: string;
}

export interface UserConfigStruct {
  dosboxWrapper: {
    dosbox: {
      conf?: UserDosboxConf;
      command?: string;
    };
    paths?: {
      bin?: string;
    };
  };
}

export class UserConfig {
  public filePath: string;
  private config: UserConfigStruct | undefined;

  public get dosboxConf(): UserDosboxConf {
    if (this.config?.dosboxWrapper?.dosbox?.conf === undefined) {
      return {};
    }
    return this.config?.dosboxWrapper?.dosbox?.conf;
  }

  public get dosboxCommand(): string | undefined {
    return this.config?.dosboxWrapper?.dosbox?.command;
  }

  public get binPath(): string | undefined {
    return this.config?.dosboxWrapper?.paths?.bin;
  }

  public async load(filePath: string): Promise<void> {
    this.filePath = filePath;
    const ymlContent = await fs.promises.readFile(filePath, 'utf-8');
    this.config = yaml.load(ymlContent) as UserConfigStruct;
  }
}
