import { createLogger, format, transports } from 'winston';

const { combine, splat, timestamp, printf } = format;

const enumerateErrorFormat = format((info: any) => {
  if (info.message instanceof Error) {
    info.message = {
      message: info.message.message,
      stack: info.message.stack,
      ...info.message,
    };
  }

  if (info instanceof Error) {
    return {
      stack: info.stack,
      ...info,
    };
  }

  return info;
});

const logger = createLogger({
  level: 'debug',
  format: combine(
    enumerateErrorFormat(),
    splat(),
    timestamp(),
    printf(
      ({ level, message, timestamp, stack }) =>
        `${timestamp} ${level} : ${stack ? JSON.stringify(stack) : message}`,
    ),
  ),
  transports: [new transports.Console({})],
});

export default logger;

export function logError(message: string) {
  logger.error(message);
}

export function logInfoMessage(message: string) {
  logger.info(message);
}

export function logWarningMessage(message: string) {
  logger.warn(message);
}
