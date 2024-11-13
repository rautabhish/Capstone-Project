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
        console.log('Started inserting data into database...');
        const response = await axios.get(yelpSearchUrl, {
            headers: { Authorization: `Bearer ${apiKey}` },
            params: { location: 'Boston', categories: 'restaurants', limit: 5 }
        });

        for (const business of response.data.businesses) {
            const reviewsResponse = await axios.get(yelpReviewsUrl(business.id), {
                headers: { Authorization: `Bearer ${apiKey}` }
            });

            const reviews = reviewsResponse.data.reviews.map(review => review.text);
            const query = 'INSERT INTO restaurant_info (id, ratings, restaurant_name, reviews) VALUES (?, ?, ?, ?)';
            const params = [uuidv4(), business.rating, business.name, reviews];
            await client.execute(query, params, { prepare: true });
        }
        console.log('Data successfully inserted into database.');
    } catch (error) {
        console.error('Error fetching data or inserting into database:', error);
    }
}

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

    console.log('Authenticating with the following details:');
    console.log('Username:', username);  // This should now dynamically reflect 'akshata' or any user signing in
    console.log('Restaurant Name:', restaurantName);
    console.log('PIN:', pin);

    const query = 'SELECT * FROM users WHERE username = ? AND restaurant_name = ? AND pin = ? ALLOW FILTERING';

    try {
        const result = await client.execute(query, [username, restaurantName, pin], { prepare: true });
        console.log('Query result:', result.rows);

        if (result.rowLength > 0) {
            const restaurantQuery = 'SELECT * FROM restaurant_info WHERE restaurant_name = ?';
            const restaurantData = await client.execute(restaurantQuery, [restaurantName], { prepare: true });
            res.json({ success: true, restaurantData: restaurantData.rows });
        } else {
            res.json({ success: false, message: 'Authentication failed. Invalid restaurant name or PIN.' });
        }
    } catch (error) {
        console.error('Error authenticating restaurant:', error);
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
