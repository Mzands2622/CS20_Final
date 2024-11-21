require('dotenv').config()
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const clientID = "5c5ccfd064e04044b9126c80f95cd30c";
const clientSECRET = "b3b84453bbc94604871471274b450873";

const basicAuth = Buffer.from(`${clientID}:${clientSECRET}`).toString('base64');

app.get('/token', async (req, res) => {
    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({grant_type: 'client_credentials'}),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${basicAuth}`,
                },
            }
        );
        res.json(response.data)
    } catch (error) {
        console.error('Error fetching token!');
        res.status(500).json({error: 'Failed to fetch token'});
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});