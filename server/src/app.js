require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const governmentRoutes = require('./routes/governmentRoutes');
const apiLimiter = require('./middleware/rateLimiter');
const validateQueryParams = require('./middleware/validateQueryParams');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply security rate limiting & query parameter validation
app.use('/api/', apiLimiter);
app.use('/api/government', validateQueryParams, governmentRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'CivicSphere Government Navigator API is running'
    });
});

// JSON 404 handler for unknown API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'The requested API endpoint does not exist.'
        }
    });
});

module.exports = app;