import express, { json } from 'express';
import cors from 'cors';
import sportsRoutes from './routes/sports.js';
import matchOddsRoutes from './routes/matchOdds.js';
import tvRoutes from './routes/tv.js';

const app = express();

app.use(json());
app.use(cors({
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => {
	res.status(200).json({ message: 'Server is healthy.' });
});

app.use('/getSports', sportsRoutes);
app.use('/match-odds', matchOddsRoutes);
app.use('/tv', tvRoutes);

export default app;
