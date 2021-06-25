import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface UserDosboxConf {
  [key: string]: string;
}

export interface UserConfigStruct {
  dosboxWrapper: {
    conf: UserDosboxConf;
    bin: {
      cFolderPath?: string;
      exeToLaunch?: string;
    };
  };
}

export class UserConfig {
  private config: UserConfigStruct | undefined;

  public get dosboxConf(): UserDosboxConf {
    if (this.config === undefined || this.config.dosboxWrapper === undefined || this.config.dosboxWrapper.conf === undefined) {
      return {};
    }
    return this.config?.dosboxWrapper?.conf;
  }

  public get cFolderPath(): string | undefined {
    return this.config?.dosboxWrapper?.bin?.cFolderPath;
  }

  public get exeToLaunch(): string | undefined {
    return this.config?.dosboxWrapper?.bin?.exeToLaunch;
  }

  public async load(filePath: string): Promise<void> {
    const ymlContent = await fs.promises.readFile(filePath, 'utf-8');
    this.config = yaml.load(ymlContent) as UserConfigStruct;
  }
}
