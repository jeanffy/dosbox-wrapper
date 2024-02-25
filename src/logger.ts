const reset = '\x1b[0m';
const dim = '\x1b[2m';
const fgRed = '\x1b[31m';
const fgYellow = '\x1b[33m';

export class Logger {
  public debug(message: string): void {
    // eslint-disable-next-line no-console
    console.debug(`${dim}${message}${reset}`);
  }

  public info(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  public warning(message: string): void {
    console.warn(`${fgYellow}${message}${reset}`);
  }

  public error(message: string): void {
    console.warn(`${fgRed}${message}${reset}`);
  }

  public exception(error: unknown, message: string): void {
    let errorProp = error;
    if (error !== undefined && error instanceof Error && error.stack !== undefined) {
      errorProp = error.stack.split('\n').map(l => l.trim());
    }
    console.error(`${fgRed}${message}${reset}`, errorProp);
  }
}
