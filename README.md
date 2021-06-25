- [Prerequisites](#prerequisites)
- [Basic use](#basic-use)
  - [Name limitations](#name-limitations)
- [Sound inside DOSBox](#sound-inside-dosbox)
- [Specific DOSBox configuration](#specific-dosbox-configuration)
- [Mount a floppy drive](#mount-a-floppy-drive)
- [Mount CD-Rom drives](#mount-cd-rom-drives)
  - [From folders](#from-folders)
  - [From ISO files](#from-iso-files)
- [Spécific wrapper configuration](#spécific-wrapper-configuration)
- [To install a program from a CD-Rom](#to-install-a-program-from-a-cd-rom)
- [Captures](#captures)
- [Generated doxbox.conf files](#generated-doxboxconf-files)
- [References](#references)

# Prerequisites

Install DOSBox and make it available to your command line.

> For macOS, just drop the DOSBox application to the `/Application` folder for example.

Install dependencies:

```shell
npm ci
```

# Basic use

First, you will need a folder of a DOS program to use.

Create the following folder tree in `bin`:

```
bin
└── <name>
    └── c
        └── <name>
```

Put all program files in `bin/<name>/c/<name>` folder.

Then simply type

```shell
npm start <name>
```

to launch program inside DOSBox.

With no other modifications, DOSBox will start, mount the drive C with folder `bin/<name>/c` and `cd` to the `<name>` directory.

The `<name>` argument is case insensitive. If your folder tree is `bin/UltimaIV/c/UltimaIV`, you can safely type `npm start ultimaiv`.

> If the `bin/<name>/C/<name>` folder does not exist, DOSBox will not `cd` to the `<name>` directory, it will just stay at the `C:>` prompt (and it that case, the executable `<exe>` won't be launched).

## Name limitations

The `<name>` mut be 8 characters maximum and must not contains spaces. Folders inside DOSBox with `~1`-like suffix are not handled.

For example, if your folder tree is `bin/Ultima Underworld/c/UltimaUnderworld`, the folder inside DOSBox will be `ULTIMA~1`.

If you want different names for `bin/<name>` and `bin/<name>/c/<name>`, look at specific wrapper configuration just below.

# Sound inside DOSBox

If you need it, sound is configured with the following:

- Sounblaster 16
- Port 220
- IRQ 7
- DMA 1

# Specific DOSBox configuration

A specific `config.yml` file can be create in `bin/<name>/config.yml`. This file can be used to customize DOSBox.

```yaml
dosboxWrapper:
  conf:
    key1: value1
    key2: >-
      value2 line1
      value2 line2
```

The `doxbox.conf` will be appended with:

```
[key1]
value1
[key2]
value2 line1
value2 line2
```

In this specific configuration, the following placeholders can be used:

- `{{binfolder}}` to refer to the program directory (`bin/<name>`)
- `{{cfolder}}` to refer to the program binary directory (`bin/<name>/c/<name>`)

# Mount a floppy drive

Create the folder `bin/<name>/a` and put the files in it. Drive letter A will be available.

# Mount CD-Rom drives

## From folders

Create the folder `bin/<name>/d` and put the files in it. Drive letter D will be available.

> If another drive letter is needed, create the folder `bin/<name>/<letter>` (available letters from 'd' to 'p'). Note that all preceding folders must be created before (for example if drive letter is 'G', folders 'D', 'E' and 'F' must exist).

## From ISO files

As with folders, put a file named `bin/<name>/d.iso`. Drive letter D will be available.

> Folders takes precedence over ISO files. If folder `d` and file `d.iso` exist, drive d will be mounted from folder.

> If another drive letter is needed, use the same principle as for folders.

`.cue` and `.bin` image files are also handled.

# Spécific wrapper configuration

A specific `config.yml` file can be create in `bin/<name>/config.yml`. This file can be used to customize how this wrapper works.

```yaml
dosboxWrapper:
  bin:
    cFolderPath: <string>
    exeToLaunch: <string>
```

- `cFolderPath`: relative folder path (subfolder of `C:\` inside DOSBox) - separator must be slash character (`/`)
- `exeToLaunch`: name of exe, com, etc. to launch at startup

For example, when you configure a different name for the folder inside `c` (`bin/<name1>/c/<name2>`), the `config.yml` should look like:

```yaml
dosboxWrapper:
  bin:
    cFolderPath: <name2>
```

The command to run the program should be:

```shell
npm start <name1>
```

# To install a program from a CD-Rom

When you just have a `.iso` file representing a CD-Rom image, the process is:

- create folder tree `bin/<name>/c/<name>`
- leave the `bin/<name>/c/<name>` folder empty
- copy the `.iso` file in `bin/<name>/d.iso` (the name of the file is important)
- type `npm start <name>`
- inside DOSBox:
  - type `d:`
  - run the installation program that should be available in the D drive
  - you can then install in the `C:\<name>` folder

# Captures

All DOXBox captures (for example screenshots with `Ctrl-F5`) will go to the `bin/<name>/captures` folder.

# Generated doxbox.conf files

Generated dosbox.conf files can be found in the `data/config` folder.

# References

- [DOSBox wiki](https://www.dosbox.com/wiki/Main_Page)
