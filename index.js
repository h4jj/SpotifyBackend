const express = require('express');
const cors = require('cors');
const querystring = require('querystring');

require('dotenv').config()

const { checkUserExists, createUser, loginUser } = require('./database/utils');

const app = express();
app.use(cors())
app.use(express.json())

const port = 8000


async function fetchData(url, options) {
    const fetch = (await import('node-fetch')).default;
    return fetch(url, options);
}


app.post('/signIn', async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    const userExists = await checkUserExists(email)

    if (!userExists) {
        await createUser(email, password)
        return res.status(200).json({ status: 'successfully created new user' })
    }
    else {
        const token = await loginUser(email, password)
        if (token) {
            return res.status(200).json({ message: 'correct password', token: token })
        }
        else {
            return res.status(400).json({ message: 'authentication failed' })
        }
    }
});

app.get('/spotifyLogin', async (req, res) => {

    const clientId = "cde3c1a716e3473e8237ffdc368c02df"
    const scopes = 'user-read-private user-read-email';
    const redirectUri = encodeURIComponent('http://localhost:8000/callback');

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${redirectUri}`;

    res.redirect(spotifyAuthUrl)

})

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    const clientId = "cde3c1a716e3473e8237ffdc368c02df"
    const clientSecret = "1efd7d805da44dbd9d8d45973f3abb36"
    const redirectUri = 'http://localhost:8000/callback'

    const tokenResponse = await fetchData('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
        return res.redirect(`http://localhost:3000`)
    }
    else {
        res.redirect(`http://localhost:3000/dashboard?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}`);

    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});