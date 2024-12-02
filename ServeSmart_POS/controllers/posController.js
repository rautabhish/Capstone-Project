const client = require('../config/cassandra');

async function addItem(req, res) {
    const { item_name, price } = req.body;
    const restaurant_name = req.session.restaurant_name; // Get from session

    if (!restaurant_name) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!item_name || !price) {
        return res.status(400).json({ error: 'Item name and price are required' });
    }

    try {
        const query = `
            INSERT INTO pos_dataset (restaurant_name, date, item_name, price)
            VALUES (?, toTimestamp(now()), ?, ?)`;
        await client.execute(query, [restaurant_name, item_name, price], { prepare: true });

        res.status(200).json({ message: 'Item added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add item' });
    }
}

module.exports = { addItem };
