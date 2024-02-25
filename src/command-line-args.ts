import { Command } from 'commander';

export enum AppCommand {
  Run = 'run',
}

export interface RunParameters {
  appName: string;
}

export class CommandLineArgs {
  private program = new Command();

  public command?: AppCommand;
  public runParameters?: RunParameters;

  public constructor() {
    this.program
      .command(`${AppCommand.Run} <appName>`)
      .description('Run app')
      .action(appName => {
        this.command = AppCommand.Run;
        this.runParameters = {
          appName: appName,
        };
      });

    this.program.parse();
  }
}
