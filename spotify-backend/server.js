require('dotenv').config()
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const clientID = process.env.SPOTIFY_CLIENT_ID;
const clientSECRET = process.env.SPOTIFY_CLIENT_SECRET;

const basicAuth = Buffer.from(`${clientID}:${clientSECRET}`).toString('base64');

app.get('/', (req, res) => {
    res.send('Welcome to the Spotify Backend API!');
})

app.get('/events', async (req, res) => {
    const artist_name = req.query.artist;
    const ticketMasterAPIKey = process.env.TICKETMASTER_API_KEY;

    try {
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', {
            params: {
                apikey: ticketMasterAPIKey,
                keyword: artist_name
            }
        });

        if (response.data._embedded && response.data._embedded.events) {
            res.json(response.data._embedded.events);
        } else {
            res.json([]);
        }
    } catch (error) {
        res.status(500).json({error: "Failed to fetch events!"});
    }
});



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