import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { ProgramConfig } from '../config/program-config.js';
import { UserConfig } from '../config/user-config.js';
import { DOSBox, DOSBoxDrive, DOSBoxFloppy, DOSBoxFloppyDrive } from '../dosbox.js';
import { Logger } from '../logger.js';
import { DBWError, Utils } from '../utils.js';

export class RunCommand {
  public constructor(
    private logger: Logger,
    private dosbox: DOSBox,
  ) {}

  public async run(appName: string): Promise<void> {
    // Configuration

    const userConfig = new UserConfig();
    const userConfigYmlFile = path.join(os.homedir(), '.dosbox-wrapper');
    if (await Utils.fileExists(userConfigYmlFile)) {
      this.logger.info(`Using user config in '${userConfigYmlFile}'`);
      await userConfig.load(userConfigYmlFile);
    }

    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
    let root = path.resolve(path.join(__dirname, '..', '..'));
    if (process.env.DBW_DIST !== undefined) {
      root = path.resolve(path.join(root, '..'));
    }
    const hddRoot = userConfig.hddPath !== undefined ? userConfig.hddPath : path.join(root, 'hdd');
    const configHddFolderPlaceholder = '{{hddFolder}}';
    const configCFolderPlaceholder = '{{cFolder}}';
    const dosboxGeneratedConfigRoot = path.join(root, 'data', 'config');
    const commonConfigPath = path.join(root, 'data', 'common.conf');
    const freesizeC = 900;

    if (!(await Utils.directoryExists(hddRoot))) {
      throw new DBWError(`No folder at '${hddRoot}'`);
    }

    // Parsing user arguments

    // Game name will be used for:
    // - folder name (in Data folder) that contains program (folder just beside Data and subfolder beside "c" folder)
    // - file name (in Config folder) that contains DOSBox specific config
    const progFolder = path.join(hddRoot, appName);

    const programConfig = new ProgramConfig();
    const programConfigYmlFile = path.join(progFolder, 'config.yml');
    if (await Utils.fileExists(programConfigYmlFile)) {
      this.logger.info(`Using program config in '${programConfigYmlFile}'`);
      await programConfig.load(programConfigYmlFile);
    }

    const programHddFolderName = programConfig.cFolderPath ?? appName;
    const programHddFolder = path.join(progFolder, 'c', programConfig.cFolderPath ?? programHddFolderName);
    const dosboxConfigFile = path.join(dosboxGeneratedConfigRoot, `${appName}.conf`);
    const capturesFolder = path.join(progFolder, 'captures');

    const exeToLaunch = programConfig.exeToLaunch;
    let cmdToLaunch: string | undefined;

    if (!(await Utils.directoryExists(progFolder))) {
      throw new DBWError(`No folder at '${progFolder}'`);
    }
    if (!(await Utils.directoryExists(programHddFolder))) {
      //throw new DBWError(`No hdd folder at '${programHddFolder}'`);
      this.logger.warning(`No hdd folder at '${programHddFolder}'`);
    }

    if (exeToLaunch === undefined) {
      cmdToLaunch = `if exist ${programHddFolderName}.exe ${programHddFolderName}.exe`;
      this.logger.warning(
        `No executable specified, will try to run '${programHddFolderName}.exe', otherwise must be ran manually from command prompt`,
      );
    }

    // Creating necessary folders

    await fs.mkdir(dosboxGeneratedConfigRoot, { recursive: true });
    await fs.mkdir(capturesFolder, { recursive: true });

    this.logger.info(`Captures folder in '${capturesFolder}'`);

    // Creating DOSBox config file

    // start with default config file

    await fs.copyFile(commonConfigPath, dosboxConfigFile);

    // append user-level provided config

    for (const key in userConfig.dosboxConf) {
      if (userConfig.dosboxConf[key] !== undefined) {
        const value = userConfig.dosboxConf[key];
        this.logger.info(`Using user DOSBox [${key}] config in '${userConfig.filePath}'`);
        await Utils.appendFile(
          dosboxConfigFile,
          `
          # added from ${userConfig.filePath}
          [${key}]
          ${value}
        `,
        );
      }
    }

    // append necessary commands to mount folder and run program

    await Utils.appendFile(
      dosboxConfigFile,
      `
      # added from dosbox-wrapper
      [dosbox]
      captures="$${capturesFolder}"
      [autoexec]
    `,
    );

    // mount floppy volumes if provided
    const floppies: DOSBoxFloppy[] = [
      { letter: DOSBoxFloppyDrive.A, folderPath: path.join(progFolder, 'a'), imgPath: path.join(progFolder, 'a.img') },
      { letter: DOSBoxFloppyDrive.B, folderPath: path.join(progFolder, 'b'), imgPath: path.join(progFolder, 'b.img') },
    ];
    await this.dosbox.mountFloppies(floppies, dosboxConfigFile);

    // mount CD-rom volumes if provided
    const drives: DOSBoxDrive[] = ['d', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'].map(letter => ({
      letter: letter,
      folderPath: path.join(progFolder, letter),
      isoPath: path.join(progFolder, `${letter}.iso`),
      cuePath: path.join(progFolder, `${letter}.cue`),
      binPath: path.join(progFolder, `${letter}.bin`),
    }));
    await this.dosbox.mountDrives(drives, programHddFolderName, dosboxConfigFile);

    // mount system drive c:
    await this.dosbox.mountSystem({ folderPath: path.join(progFolder, 'c'), freeSize: freesizeC }, dosboxConfigFile);

    await Utils.appendFile(dosboxConfigFile, 'c:');

    if (await Utils.directoryExists(programHddFolder)) {
      let runCommand = '';
      if (exeToLaunch !== undefined) {
        runCommand = exeToLaunch;
      } else if (cmdToLaunch !== undefined) {
        runCommand = cmdToLaunch;
      }
      const programHddFolderNameWithBackslashes = programHddFolderName.split('/').join('\\');
      await Utils.appendFile(
        dosboxConfigFile,
        `
        cd ${programHddFolderNameWithBackslashes}
        ${programConfig.exePreCommand !== undefined ? programConfig.exePreCommand : ''}
        ${runCommand}
      `,
      );
    }

    // append program config file if provided

    for (const key in programConfig.dosboxConf) {
      if (programConfig.dosboxConf[key] !== undefined) {
        let value = programConfig.dosboxConf[key];
        this.logger.info(`Using program DOSBox [${key}] config in '${programConfig.filePath}'`);
        value = value.split(configHddFolderPlaceholder).join(progFolder);
        value = value.split(configCFolderPlaceholder).join(programHddFolder);
        await Utils.appendFile(
          dosboxConfigFile,
          `
          # added from ${programConfig.filePath}
          [${key}]
          ${value}
        `,
        );
      }
    }

    // Launching DOSBox

    await this.dosbox.launch(userConfig, dosboxConfigFile);
  }
}
