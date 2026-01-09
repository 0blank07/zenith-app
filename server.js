const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Proxy /api requests to the remote HTTP server
app.use('/api', createProxyMiddleware({
    target: 'http://103.235.105.250:8000',
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
    }
}));

// Proxy /health request
app.use('/health', createProxyMiddleware({
    target: 'http://103.235.105.250:8000',
    changeOrigin: true,
    logLevel: 'debug'
}));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Fallback for SPA (if needed, though this app seems to use hash routing or simple view switching)
// For now, just serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    🚀 Server running on port ${PORT}

    Proxying /api/* -> http://103.235.105.250:8000/api/*
    Serving static files from ${__dirname}

    Open the app in your browser: http://localhost:${PORT}
    `);
});
