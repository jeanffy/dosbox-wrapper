import * as fs from 'fs';
import * as yaml from 'js-yaml';

//
// configuration (possibly) located in each program folder (subfolder of bin folder)
//

export interface ProgramDosboxConf {
  [key: string]: string;
}

export interface ProgramConfigStruct {
  dosboxWrapper: {
    dosbox: {
      conf: ProgramDosboxConf;
    };
    bin: {
      cFolderPath?: string;
      exeToLaunch?: string;
      exePreCommand?: string;
    };
  };
}

export class ProgramConfig {
  public filePath: string;
  private config: ProgramConfigStruct | undefined;

  public get dosboxConf(): ProgramDosboxConf {
    if (this.config?.dosboxWrapper?.dosbox?.conf === undefined) {
      return {};
    }
    return this.config?.dosboxWrapper?.dosbox?.conf;
  }

  public get cFolderPath(): string | undefined {
    return this.config?.dosboxWrapper?.bin?.cFolderPath;
  }

  public get exeToLaunch(): string | undefined {
    return this.config?.dosboxWrapper?.bin?.exeToLaunch;
  }

  public get exePreCommand(): string | undefined {
    return this.config?.dosboxWrapper?.bin?.exePreCommand;
  }

  public async load(filePath: string): Promise<void> {
    this.filePath = filePath;
    const ymlContent = await fs.promises.readFile(filePath, 'utf-8');
    this.config = yaml.load(ymlContent) as ProgramConfigStruct;
  }
}
