import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Custom log format with label (module), action, reason, stack
const logFormat = winston.format.printf(({ timestamp, level, label, message, stack, ...meta }) => {
	const context = {
		...(meta.action && { action: meta.action }),
		...(meta.reason && { reason: meta.reason }),
		...(meta.error && { error: meta.error }),
	};
	const contextStr = Object.keys(context).length ? JSON.stringify(context) : '';
	const stackStr = stack ? `\n${stack}` : '';

	return `${timestamp} [${level.toUpperCase()}] [${label}] : ${message} ${contextStr}${stackStr}`;
});

// Factory to create a logger with label (module name)
const createLogger = (label) => {
	return winston.createLogger({
		level: 'info',
		format: winston.format.combine(
			winston.format.label({ label }),
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			logFormat
		),
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.simple()
				)
			}),
			new DailyRotateFile({
				filename: 'logs/app-%DATE%.log',
				datePattern: 'YYYY-MM-DD',
				zippedArchive: true,
				maxSize: '20m',
				maxFiles: '14d'
			})
		],
		exitOnError: false
	});
};

export default createLogger;
