const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const pool = new Pool({
    user: 'ahmadelhajj',
    host: 'localhost',
    database: 'user_data',
    password: 'Bondig@1829',
    port: 5432,
});

async function checkUserExists(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    try {
        const res = await pool.query(query, [username]);
        return res.rows.length > 0;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function createUser(username, password) {
    const hashedPassword = await hashPassword(password);

    // Assuming you have a function to insert a user into your database
    await insertUserIntoDatabase(username, hashedPassword);
}

async function insertUserIntoDatabase(username, hashedPassword) {
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2)';
    try {
        await pool.query(query, [username, hashedPassword]);
        console.log('User inserted successfully');
    } catch (err) {
        console.error('Error inserting user into database:', err);
        throw err;
    }
}

async function hashPassword(password) {
    const saltRounds = 10; // You can adjust the salt rounds, higher is more secure but more CPU-intensive
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw error;
    }
}

async function getUserFromDatabase(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    try {
        const res = await pool.query(query, [username]);
        if (res.rows.length > 0) {
            return res.rows[0]; // Return the first row (user data)
        } else {
            return null; // User not found
        }
    } catch (err) {
        console.error('Error querying user from database:', err);
        throw err;
    }
}

async function loginUser(username, password) {
    const user = await getUserFromDatabase(username);
    if (user && await bcrypt.compare(password, user.password)) {
        // Password is correct, generate token
        const token = jwt.sign({ userId: user.id }, process.env.secretKey, { expiresIn: '6h' });
        return token; // Send this token back to the client
    } else {
        // Authentication failed
        throw new Error('Invalid credentials');
    }
}
module.exports = { checkUserExists, hashPassword, createUser, loginUser }