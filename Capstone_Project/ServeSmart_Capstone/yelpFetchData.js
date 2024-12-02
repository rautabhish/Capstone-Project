//tvvW9acZvXk3BhIn-U0LUY7YhaZUxhKJ_cw9JYkIdOpdsjphkAJ-tG5gObR-L2SRgd3OXgw0L0CvtS7LGu_edT8v1qugllaE9UyMzTki6u4-mcoKvobbfJUHSaocZXYx

const express = require('express');
const cassandra = require('cassandra-driver');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const portfinder = require('portfinder');

const app = express();

// Initialize the Cassandra client
const client = new cassandra.Client({
    contactPoints: ['127.0.0.1:9042'],
    localDataCenter: 'datacenter1',
    keyspace: 'smartserve'
});

app.use(express.json());
app.use(express.static('views'));

// Serve the dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// Yelp API details
const apiKey = 'tvvW9acZvXk3BhIn-U0LUY7YhaZUxhKJ_cw9JYkIdOpdsjphkAJ-tG5gObR-L2SRgd3OXgw0L0CvtS7LGu_edT8v1qugllaE9UyMzTki6u4-mcoKvobbfJUHSaocZXYx'; // Replace with your actual Yelp API key
const yelpSearchUrl = 'https://api.yelp.com/v3/businesses/search';
const yelpReviewsUrl = (id) => `https://api.yelp.com/v3/businesses/${id}/reviews`;

// Function to fetch data from Yelp and insert into Cassandra
async function fetchDataAndStore() {
    try {
        console.log('Started inserting/updating data into the database...');

        // Fetch restaurant data from Yelp
        const response = await axios.get(yelpSearchUrl, {
            headers: { Authorization: `Bearer ${apiKey}` },
            params: { location: 'Boston', categories: 'restaurants', limit: 5 }
        });

        for (const business of response.data.businesses) {
            const reviewsResponse = await axios.get(yelpReviewsUrl(business.id), {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            const reviews = reviewsResponse.data.reviews.map(review => review.text);

            // Check if the restaurant already exists in the database
            const selectQuery = 'SELECT id FROM restaurant_info WHERE restaurant_name = ? ALLOW FILTERING';
            const selectParams = [business.name];
            const existingEntry = await client.execute(selectQuery, selectParams, { prepare: true });

            if (existingEntry.rowLength > 0) {
                // Update existing restaurant entry
                const updateQuery = `
                    UPDATE restaurant_info
                    SET ratings = ?, reviews = ?
                    WHERE id = ?
                `;
                const updateParams = [business.rating, reviews, existingEntry.rows[0].id];
                await client.execute(updateQuery, updateParams, { prepare: true });
                console.log(`Updated existing restaurant: ${business.name}`);
            } else {
                // Insert new restaurant entry
                const insertQuery = `
                    INSERT INTO restaurant_info (id, ratings, restaurant_name, reviews)
                    VALUES (?, ?, ?, ?)
                `;
                const insertParams = [uuidv4(), business.rating, business.name, reviews];
                await client.execute(insertQuery, insertParams, { prepare: true });
                console.log(`Inserted new restaurant: ${business.name}`);
            }
        }
        console.log('Data successfully inserted/updated in the database.');
    } catch (error) {
        console.error('Error fetching data or inserting/updating database:', error);
    }
}
//  The following block to schedule fetchDataAndStore to run every 24 hours in the future
/*
const scheduleJob = () => {
    console.log('Scheduling fetchDataAndStore to run every 24 hours...');
    // Schedule the job to run every day at midnight
    nodeSchedule.scheduleJob('0 0 * * *', async () => {
        console.log('Running scheduled fetchDataAndStore...');
        await fetchDataAndStore();
    });
};

// Call this function to activate the scheduler
// scheduleJob();

module.exports = { fetchDataAndStore };
*/

// Serve the signin page as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signin.html'));
});

// Signup endpoint
app.post('/signup', async (req, res) => {
    const { username, password, pin, restaurantName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, pin, restaurant_name) VALUES (?, ?, ?, ?)';
    const params = [username, hashedPassword, pin, restaurantName];
    try {
        await client.execute(query, params, { prepare: true });
        res.json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Signup failed.' });
    }
});

// Signin endpoint
app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';
    try {
        const result = await client.execute(query, [username], { prepare: true });
        const user = result.rows[0];
        if (user && await bcrypt.compare(password, user.password)) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid username or password.' });
        }
    } catch (error) {
        console.error('Error during signin:', error);
        res.status(500).json({ message: 'Signin failed.' });
    }
});

// Fetch restaurant data for dashboard
app.post('/dashboard', async (req, res) => {
    const { username, restaurantName, pin } = req.body;

    console.log('Step 1: Received dashboard request');
    console.log('Authenticating with the following details:');
    console.log('Username:', username);
    console.log('Restaurant Name:', restaurantName);
    console.log('PIN:', pin);

    const userQuery = 'SELECT * FROM users WHERE username = ? AND restaurant_name = ? AND pin = ? ALLOW FILTERING';
    const restaurantQuery = 'SELECT * FROM restaurant_info WHERE restaurant_name = ?';
    const posQuery = 'SELECT * FROM pos_dataset WHERE restaurant_name = ?';

    try {
        console.log('Step 2: Authenticating user...');
        // Authenticate user
        const userResult = await client.execute(userQuery, [username, restaurantName, pin], { prepare: true });
        console.log('Query result:', userResult.rows);

        if (userResult.rowLength > 0) {
            console.log('Step 3: Authentication successful.');

            // Fetch restaurant info
            console.log('Step 4: Fetching restaurant data...');
            const restaurantData = await client.execute(restaurantQuery, [restaurantName], { prepare: true });
            console.log('Restaurant Data fetched:', restaurantData.rows);

            // Fetch POS data
            console.log('Step 5: Fetching POS data...');
            const posData = await client.execute(posQuery, [restaurantName], { prepare: true });
            console.log('POS Data fetched:', posData.rows);

            // Respond with both restaurant and POS data
            console.log('Step 6: Sending response...');
            res.json({
                success: true,
                restaurantData: restaurantData.rows,
                posData: posData.rows,
            });
        } else {
            console.log('Step 3: Authentication failed.');
            res.json({ success: false, message: 'Authentication failed. Invalid restaurant name or PIN.' });
        }
    } catch (error) {
        console.error('Error during dashboard request processing:', error);

        // Check which query caused the issue
        if (error.message.includes('restaurant_info')) {
            console.error('Error fetching restaurant info:', error);
        } else if (error.message.includes('pos_dataset')) {
            console.error('Error fetching POS data:', error);
        } else {
            console.error('General error:', error);
        }

        res.status(500).json({ success: false, message: 'Server error occurred.' });
    }
});


// Start the server and automatically find an available port
portfinder.basePort = 3000;

portfinder.getPort((err, port) => {
    if (err) {
        console.error('Error finding an available port:', err);
        return;
    }

    app.listen(port, async () => {
        console.log(`Server running at http://localhost:${port}`);
        await fetchDataAndStore();
    });
});
