import dotenv from 'dotenv';
import app from './app.js';
import { initBrowser, closeBrowser } from './services/browserManager.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		await initBrowser(); // Initialize browser session
		console.log('Browser session initialized');

		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
		});
	} catch (err) {
		console.error('Failed to initialize browser session:', err);
		process.exit(1);
	}
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('\nGracefully shutting down...');
	await closeBrowser();
	process.exit();
});

process.on('SIGTERM', async () => {
	console.log('\nGracefully shutting down...');
	await closeBrowser();
	process.exit();
});
