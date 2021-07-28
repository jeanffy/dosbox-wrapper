import * as fs from 'fs';
import * as path from 'path';
import { DOSBox, DOSBoxDrive } from './dosbox';
import { MyConsole } from './my-console';
import { DBWError, Utils } from './utils';
import { UserConfig } from './user-config';

function usage(): void {
  MyConsole.log('npm start <prog-name> [<exe-to-launch>]')
}

async function main(args: string[]): Promise<void> {
  if (args.length < 1) {
    usage();
    throw new DBWError('No name provided');
  }

  // Configuration

  let root = path.resolve(path.join(__dirname, '..'));
  if (process.env.DBW_DIST) {
    root = path.resolve(path.join(root, '..'));
  }
  const binRoot = path.join(root, 'bin');
  const configBinFolderPlaceholder = '{{binfolder}}';
  const configCFolderPlaceholder = '{{cfolder}}';
  const dosboxGeneratedConfigRoot = path.join(root, 'data', 'config');
  const commonConfigPath = path.join(root, 'data', 'common.conf');
  const freesizeC = 900;

  // Parsing user arguments

  // Game name will be used for:
  // - folder name (in Data folder) that contains program (folder just beside Data and subfolder beside "c" folder)
  // - file name (in Config folder) that contains DOSBox specific config
  const progName = args[0];
  const progFolder = path.join(binRoot, progName);

  const userConfig = new UserConfig();
  const userConfigYmlFile = path.join(progFolder, 'config.yml');
  if (await Utils.fileExists(userConfigYmlFile)) {
    MyConsole.notice(`Using config in '${userConfigYmlFile}'`);
    await userConfig.load(userConfigYmlFile);
  }

  const programBinFolderName = userConfig.cFolderPath ?? progName;
  const programBinFolder = path.join(progFolder, 'c', userConfig.cFolderPath ?? programBinFolderName);
  const dosboxConfigFile = path.join(dosboxGeneratedConfigRoot, `${progName}.conf`);
  const capturesFolder = path.join(progFolder, 'captures');

  const exeToLaunch = userConfig.exeToLaunch;
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
      ${userConfig.exePreCommand !== undefined ? userConfig.exePreCommand : ''}
      ${runCommand}
    `);
  }

  // append user config file if provided
  if (await Utils.fileExists(userConfigYmlFile)) {
    for (const key in userConfig.dosboxConf) {
      let value = userConfig.dosboxConf[key];
      if (value !== undefined) {
        MyConsole.notice(`Using user DOSBox [${key}] config in '${userConfigYmlFile}'`);
        value = value.split(configBinFolderPlaceholder).join(progFolder);
        value = value.split(configCFolderPlaceholder).join(programBinFolder);
        await Utils.appendFile(dosboxConfigFile, `
          # added from ${userConfigYmlFile}
          [${key}]
          ${value}
        `);
      }
    }
  }

  // Launching DOSBox

  await DOSBox.launch(dosboxConfigFile);
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
