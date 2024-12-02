const express = require('express');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const posRoutes = require('./routes/posRoutes');
const detectPort = require('detect-port');

const app = express();

// Middleware
app.use(express.json());
app.use(session({
    secret: 'pos_system_secret',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static('public'));

// Routes
app.use('/auth', authRoutes);
app.use('/pos', posRoutes);

// Detect an available port and start the server
const DEFAULT_PORT = process.env.PORT || 3000;

detectPort(DEFAULT_PORT).then((availablePort) => {
    app.listen(availablePort, () => {
        console.log(`Server running on http://localhost:${availablePort}`);
    });
}).catch((err) => {
    console.error('Error detecting port:', err);
});
