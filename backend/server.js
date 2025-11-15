const path = require('path');
const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Ensure the uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Middleware to parse JSON bodies
app.use(express.json());

// Import and use the API routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Simple health check route
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', service: 'viralchemist-backend' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
