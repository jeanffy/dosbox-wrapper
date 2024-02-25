import { CommandLineArgs } from './command-line-args.js';
import { RunCommand } from './commands/run.js';
import { DOSBox } from './dosbox.js';
import { Logger } from './logger.js';

const logger = new Logger();

try {
  if (process.env.DEBUG === '1' && process.env.DEBUG_ARGV !== undefined) {
    process.argv = [...process.argv, ...JSON.parse(process.env.DEBUG_ARGV)];
  }
  const dosbox = new DOSBox(logger);
  const commandLineArgs = new CommandLineArgs();
  if (commandLineArgs.runParameters !== undefined) {
    const runCommand = new RunCommand(logger, dosbox);
    await runCommand.run(commandLineArgs.runParameters.appName);
  }
} catch (error) {
  logger.exception(error, '');
}
