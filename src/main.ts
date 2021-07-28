import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DOSBox, DOSBoxDrive } from './dosbox';
import { MyConsole } from './my-console';
import { DBWError, Utils } from './utils';
import { UserConfig, ProgramConfig } from './config';

function usage(): void {
  MyConsole.log('npm start <prog-name>')
}

async function main(args: string[]): Promise<void> {
  if (args.length < 1) {
    usage();
    throw new DBWError('No name provided');
  }

  // Configuration

  const userConfig = new UserConfig();
  const userConfigYmlFile = path.join(os.homedir(), '.dosbox-wrapper');
  if (await Utils.fileExists(userConfigYmlFile)) {
    MyConsole.notice(`Using user config in '${userConfigYmlFile}'`);
    await userConfig.load(userConfigYmlFile);
  }

  let root = path.resolve(path.join(__dirname, '..'));
  if (process.env.DBW_DIST) {
    root = path.resolve(path.join(root, '..'));
  }
  const binRoot = (userConfig.binPath !== undefined ? userConfig.binPath : path.join(root, 'bin'));
  const configBinFolderPlaceholder = '{{binfolder}}';
  const configCFolderPlaceholder = '{{cfolder}}';
  const dosboxGeneratedConfigRoot = path.join(root, 'data', 'config');
  const commonConfigPath = path.join(root, 'data', 'common.conf');
  const freesizeC = 900;

  if (!(await Utils.directoryExists(binRoot))) {
    throw new DBWError(`No folder at '${binRoot}'`);
  }

  // Parsing user arguments

  // Game name will be used for:
  // - folder name (in Data folder) that contains program (folder just beside Data and subfolder beside "c" folder)
  // - file name (in Config folder) that contains DOSBox specific config
  const progName = args[0];
  const progFolder = path.join(binRoot, progName);

  const programConfig = new ProgramConfig();
  const programConfigYmlFile = path.join(progFolder, 'config.yml');
  if (await Utils.fileExists(programConfigYmlFile)) {
    MyConsole.notice(`Using program config in '${programConfigYmlFile}'`);
    await programConfig.load(programConfigYmlFile);
  }

  const programBinFolderName = programConfig.cFolderPath ?? progName;
  const programBinFolder = path.join(progFolder, 'c', programConfig.cFolderPath ?? programBinFolderName);
  const dosboxConfigFile = path.join(dosboxGeneratedConfigRoot, `${progName}.conf`);
  const capturesFolder = path.join(progFolder, 'captures');

  const exeToLaunch = programConfig.exeToLaunch;
  let cmdToLaunch = undefined;

  if (!(await Utils.directoryExists(progFolder))) {
    throw new DBWError(`No folder at '${progFolder}'`);
  }
  if (!(await Utils.directoryExists(programBinFolder))) {
    throw new DBWError(`No bin folder at '${programBinFolder}'`);
  }

  if (exeToLaunch === undefined) {
    cmdToLaunch = `if exist ${programBinFolderName}.exe ${programBinFolderName}.exe`;
    MyConsole.warn(`No executable specified, will try to run '${programBinFolderName}.exe', otherwise must be ran manually from command prompt`);
  }

  // Creating necessary folders

  await fs.promises.mkdir(dosboxGeneratedConfigRoot, { recursive: true });
  await fs.promises.mkdir(capturesFolder, { recursive: true });

  MyConsole.notice(`Captures folder in '${capturesFolder}'`);

  // Creating DOSBox config file

  // start with default config file

  await fs.promises.copyFile(commonConfigPath, dosboxConfigFile);

  // append user-level provided config

  for (const key in userConfig.dosboxConf) {
    let value = userConfig.dosboxConf[key];
    if (value !== undefined) {
      MyConsole.notice(`Using user DOSBox [${key}] config in '${userConfig.filePath}'`);
      await Utils.appendFile(dosboxConfigFile, `
        # added from ${userConfig.filePath}
        [${key}]
        ${value}
      `);
    }
  }

  // append necessary commands to mount folder and run program

  await Utils.appendFile(dosboxConfigFile, `
    # added from dosbox-wrapper
    [dosbox]
    captures="$${capturesFolder}"
    [autoexec]
  `);

  // mount floppy volume if provided
  await DOSBox.mountFloppy({ letter: 'a', folderPath: path.join(progFolder, 'a') }, dosboxConfigFile);

  // mount CD-rom volumes if provided
  const drives: DOSBoxDrive[] = ['d', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'].map(letter => ({
    letter: letter,
    folderPath: path.join(progFolder, letter),
    isoPath: path.join(progFolder, `${letter}.iso`),
    cuePath: path.join(progFolder, `${letter}.cue`),
    binPath: path.join(progFolder, `${letter}.bin`)
  }));
  await DOSBox.mountDrives(drives, programBinFolderName, dosboxConfigFile);

  // mount system drive c:
  await DOSBox.mountSystem({ folderPath: path.join(progFolder, 'c'), freeSize: freesizeC }, dosboxConfigFile);

  if (await Utils.directoryExists(programBinFolder)) {
    let runCommand = '';
    if (exeToLaunch !== undefined) {
      runCommand = exeToLaunch;
    } else if (cmdToLaunch !== undefined) {
      runCommand = cmdToLaunch;
    }
    const programBinFolderNameWithBackslashes = programBinFolderName.split('/').join('\\');
    await Utils.appendFile(dosboxConfigFile, `
      c:
      cd ${programBinFolderNameWithBackslashes}
      ${programConfig.exePreCommand !== undefined ? programConfig.exePreCommand : ''}
      ${runCommand}
    `);
  }

  // append program config file if provided

  for (const key in programConfig.dosboxConf) {
    let value = programConfig.dosboxConf[key];
    if (value !== undefined) {
      MyConsole.notice(`Using program DOSBox [${key}] config in '${programConfig.filePath}'`);
      value = value.split(configBinFolderPlaceholder).join(progFolder);
      value = value.split(configCFolderPlaceholder).join(programBinFolder);
      await Utils.appendFile(dosboxConfigFile, `
        # added from ${programConfig.filePath}
        [${key}]
        ${value}
      `);
    }
  }

  // Launching DOSBox

  await DOSBox.launch(userConfig, dosboxConfigFile);
}

async function wrapper(): Promise<void> {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    if (error instanceof DBWError) {
      MyConsole.error((error as DBWError).message);
    } else {
      MyConsole.error(error);
    }
  }
}

wrapper();
