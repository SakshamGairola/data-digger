import dotenv from 'dotenv';
import app from './app.js';
import { initBrowser, closeBrowser } from './services/browserManager.js';
import createLogger from './utils/logger.js';

const logger = createLogger('server');
dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		await initBrowser();
		logger.info('Browser session initialized', { action: 'startup' });

		app.listen(PORT, () => {
			logger.info(`Server running on http://localhost:${PORT}`, { action: 'startup' });
		});
	} catch (err) {
		logger.error('Startup failed', {
			action: 'initBrowser',
			reason: err.message,
			stack: err.stack
		});
		process.exit(1);
	}
};

startServer();

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
	process.on(signal, async () => {
		logger.info(`Received ${signal}. Shutting down...`);
		await closeBrowser();
		process.exit();
	});
});
