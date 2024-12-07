const cassandra = require('cassandra-driver');

// Initialize the Cassandra client with AstraDB Secure Connect Bundle
const client = new cassandra.Client({
    cloud: { secureConnectBundle: process.env.ASTRA_DB_CREDENTIALS_PATH },  // Use environment variable
    keyspace: 'smartserve'
});

async function createTables() {
    try {
        console.log('Creating tables in the SmartServe keyspace...');

        // Connect to AstraDB first
        await client.connect();

        // Create `users` table for user authentication and data
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                                                 username TEXT PRIMARY KEY,
                                                 password TEXT,
                                                 pin TEXT,
                                                 restaurant_name TEXT
            );
        `;
        await client.execute(createUsersTable);
        console.log('Table `users` created successfully.');

        // Create `restaurant_info` table for storing Yelp restaurant data
        const createRestaurantInfoTable = `
            CREATE TABLE IF NOT EXISTS restaurant_info (
                                                           id UUID PRIMARY KEY,
                                                           restaurant_name TEXT,
                                                           ratings FLOAT,
                                                           reviews LIST<TEXT>
            );
        `;
        await client.execute(createRestaurantInfoTable);
        console.log('Table `restaurant_info` created successfully.');

        // Create `pos_dataset` table for storing POS data
        const createPosDatasetTable = `
            CREATE TABLE IF NOT EXISTS pos_dataset (
                                                       id UUID PRIMARY KEY,
                                                       date TIMESTAMP,
                                                       item_name TEXT,
                                                       price FLOAT,
                                                       restaurant_name TEXT
            );
        `;
        await client.execute(createPosDatasetTable);
        console.log('Table `pos_dataset` created successfully.');

        console.log('All tables created successfully.');
    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        await client.shutdown();
    }
}

// Run the script
createTables();
