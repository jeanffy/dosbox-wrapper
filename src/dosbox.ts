import * as childProcess from 'child_process';
import { UserConfig } from './config';
import { MyConsole } from './my-console';
import { DBWError, Utils } from './utils';

export interface DOSBoxSystemDrive {
  folderPath: string;
  freeSize: number;
}

export enum DOSBoxFloppyDrive {
  A = 'a',
  B = 'b'
}

export interface DOSBoxFloppy {
  letter: DOSBoxFloppyDrive;
  folderPath: string;
  imgPath?: string;
}

export interface DOSBoxDrive {
  letter: string;
  folderPath: string;
  isoPath?: string;
  cuePath?: string;
  binPath?: string;
}

export namespace DOSBox {
  export async function mountSystem(drive: DOSBoxSystemDrive, configFilePath: string): Promise<void> {
    await Utils.appendFile(configFilePath, `
      mount c "${drive.folderPath}" -freesize ${drive.freeSize}
    `);
    MyConsole.notice(`System drive c: mounted to '${drive.folderPath}'`);
  }

  export async function mountFloppies(floppies: DOSBoxFloppy[], configFilePath: string): Promise<void> {
    for (const floppy of floppies) {
      if (await Utils.directoryExists(floppy.folderPath)) {
        await Utils.appendFile(configFilePath, `mount a "${floppy.folderPath}" -t floppy -freesize 1440`);
        MyConsole.notice(`Floppy drive a: mounted to '${floppy.folderPath}'`);
      } else if (floppy.imgPath !== undefined && await Utils.fileExists(floppy.imgPath)) {
        await Utils.appendFile(configFilePath, `imgmount ${floppy.letter} "${floppy.imgPath}" -t floppy`);
        MyConsole.notice(`Floppy drive ${floppy.letter}: mounted to '${floppy.imgPath}'`);
      }
    }
  }

  export async function mountDrives(drives: DOSBoxDrive[], progName: string, configFilePath: string): Promise<void> {
    for (const drive of drives) {
      if (await Utils.directoryExists(drive.folderPath)) {
        await Utils.appendFile(configFilePath, `mount ${drive.letter} "${drive.folderPath}" -t cdrom -label ${progName}_${drive.letter}`);
        MyConsole.notice(`CD-rom drive ${drive.letter}: mounted to '${drive.folderPath}'`);
      } else if (drive.isoPath !== undefined && await Utils.fileExists(drive.isoPath)) {
        await Utils.appendFile(configFilePath, `imgmount ${drive.letter} "${drive.isoPath}" -t cdrom`);
        MyConsole.notice(`CD-rom drive ${drive.letter}: mounted to '${drive.isoPath}'`);
      } else if (drive.cuePath !== undefined && await Utils.fileExists(drive.cuePath)) {
        await Utils.appendFile(configFilePath, `imgmount ${drive.letter} "${drive.cuePath}" -t cdrom`);
        MyConsole.notice(`CD-rom drive ${drive.letter}: mounted to '${drive.cuePath}'`);
      } else if (drive.binPath !== undefined && await Utils.fileExists(drive.binPath)) {
        await Utils.appendFile(configFilePath, `imgmount ${drive.letter} "${drive.binPath}" -t cdrom`);
        MyConsole.notice(`CD-rom drive ${drive.letter}: mounted to '${drive.binPath}'`);
      }
    }
  }

  export async function launch(userConfig: UserConfig, configFilePath: string): Promise<void> {
    if (!(await Utils.fileExists(configFilePath))) {
      throw new DBWError(`DOSBox config file '${configFilePath}' not found`);
    }

    MyConsole.notice(`Launching DOSBox with config in '${configFilePath}'`);
    MyConsole.notice('Useful keyboard shortcuts:');
    MyConsole.notice('  Ctrl+F1    launch key mapper (Ctrl+Option+F1 on macOS)');
    MyConsole.notice('  Ctrl+F6    take screenshot');
    MyConsole.notice('  Ctrl+F10   release mouse cursor');
    MyConsole.notice('  Ctrl+F11   decrease cycles');
    MyConsole.notice('  Ctrl+F12   increase cycles');

    let dosboxCall;
    if (userConfig.dosboxCommand !== undefined) {
      dosboxCall = userConfig.dosboxCommand;
    } else {
      switch (process.platform) {
        case 'darwin':
          dosboxCall = 'open -a DOSBox --args';
          break;
        case 'linux':
        case 'aix':
        case 'cygwin':
        case 'freebsd':
        case 'netbsd':
        case 'openbsd':
        case 'sunos':
          dosboxCall = 'dosbox';
          break;
        default:
          throw new DBWError(`Unknown platform '${process.platform}'`);
      }
    }
    dosboxCall += ` -conf "${configFilePath}" -exit`;

    // TODO: promisify
    childProcess.execSync(dosboxCall, { stdio: 'inherit' });
  }
}
