const cassandra = require('../config/cassandra');

// Login function
exports.login = async (req, res) => {
    const { restaurant_name, pin } = req.body;

    try {
        if (!restaurant_name || !pin) {
            return res.status(400).json({ error: 'Restaurant name and PIN are required.' });
        }

        const query = 'SELECT * FROM users WHERE restaurant_name = ? AND pin = ? ALLOW FILTERING';
        const params = [restaurant_name, pin];
        const result = await cassandra.execute(query, params, { prepare: true });

        if (result.rows.length > 0) {
            // Save restaurant_name in session
            req.session.restaurant_name = restaurant_name;
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid restaurant name or PIN' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
