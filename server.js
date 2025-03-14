import express from 'express';
import 'dotenv/config';
import axios from 'axios';
import {cheerio} from 'cheerio';

// Create an instance of express
const app = express();

// Use the PORT variable from .env or default to 3000 if not set
const PORT = process.env.PORT || 3000;
const URL = process.env.URL || 'https://allpanelexch.com/home';

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/getMatcheName', async (req, res) => {
    const url = 'https://example.com/matche-name';
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});