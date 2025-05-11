const browserConfigDev = {
	headless: false,
	defaultViewport: null,
};

const browserConfigProd = {
	headless: 'new',
};

const getBrowserConfig = () => {
	const env = process.env.NODE_ENV || 'development';
	return env === 'production' ? browserConfigProd : browserConfigDev;
};

export { browserConfigDev, browserConfigProd, getBrowserConfig };