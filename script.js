// Global variables
let current_section = 'header-section';
let all_sections = ['header-section', 'story-section', 'testimonials-section', 'signup-section', 'genre-section', 'playlist-section', 'events-section'];

// Scrolling Logic
function scrollToSection(section_id) {
    let next_section = document.getElementById(section_id);
    if (next_section) {
        next_section.scrollIntoView({behavior: 'smooth', block: 'start'});
        current_section = section_id;

        document.querySelectorAll('.side-dots span').forEach((dot, index) => {
            dot.classList.toggle('active', all_sections[index] == section_id);
        });
    }
}

let observer = new IntersectionObserver(
    (next_entr) => {
        next_entr.forEach(entr => {
            if (entr.isIntersecting) {
                let section_id = entr.target.id;
                current_section = section_id;

                let found_idx = all_sections.indexOf(section_id);
                document.querySelectorAll('.side-dots span').forEach((dot, index) => {
                    dot.classList.toggle('active', index == found_idx);
                });
            }
        });
    },
    {threshold: 0.5}
);

document.querySelectorAll('section').forEach(next_section => {
    observer.observe(next_section);
});

function arrowNavigation(dir) {
    let current_idx = all_sections.indexOf(current_section);
    let target_idx;

    if (dir == 'up' && current_idx > 0) {
        target_idx = current_idx - 1;
    } else if (dir == 'down' && current_idx < all_sections.length - 1) {
        target_idx = current_idx + 1;
    } else {
        return;
    }

    scrollToSection(all_sections[target_idx]);
}

document.querySelectorAll('.arrow').forEach(next_arrow => {
    next_arrow.addEventListener('click', (e) => {
        arrowNavigation(next_arrow.classList.contains('up') ? 'up' : 'down');
    });
});

// Spotify API Logic
let selectedGenres = [];

let all_pills = document.querySelectorAll('.genre-pill');
all_pills.forEach(function(next_pill) {
    next_pill.addEventListener('click', function() {

        let next_genre = next_pill.getAttribute('data-value');

        if (selectedGenres.indexOf(next_genre) != -1) {
            let new_genres = [];
            for (let i = 0; i < selectedGenres.length; i++) {
                if (selectedGenres[i] != next_genre) {
                    new_genres.push(selectedGenres[i]);
                }
            }

            selectedGenres = new_genres;

            next_pill.classList.remove('selected');
        } else {
            selectedGenres.push(next_genre);
            next_pill.classList.add('selected');
        }
    });
});

let accessToken = null;
let tokenExpirationTime = 0;

async function fetchAccessToken() {
    const response = await fetch("https://whispering-meadow-56072-ba39b0cc37be.herokuapp.com/token");
    const data = await response.json();
    accessToken = data.access_token;
    tokenExpirationTime = Date.now() + data.expires_in * 1000;
}

async function getAccessToken() {
    if (!accessToken || Date.now() >= tokenExpirationTime) {
        await fetchAccessToken();
    }
    return accessToken;
}


async function generatePlaylist() {
    if (selectedGenres.length === 0) {
        alert("Please select at least one genre.");
        return;
    }

    try {
        let accessToken = await getAccessToken();
        let all_tracks = [];

        for (let next_genre of selectedGenres) {

            let random_off = Math.floor(Math.random() * 100);
            let response = await fetch(`https://api.spotify.com/v1/search?q=genre:${next_genre}&type=track&offset=${random_off}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

        if (response.ok) {
            let data = await response.json();
            all_tracks = all_tracks.concat(data.tracks.items);
        } else {
            let errorData = await response.json();
            console.error("Spotify API Error:", errorData);
            alert("Failed to generate playlist. Please try again later.");
            return;
        }
      }

      let unique = [];
      let track_id_next = new Set();

      all_tracks.forEach(next_track => {
        if (!track_id_next.has(next_track.id)) {
            track_id_next.add(next_track.id);
            unique.push(next_track);
        }
      });

      displayPlaylist(unique);
      scrollToSection('playlist-section');
    } catch (error) {
        console.error("Error fetch playlist:", error);
    }
}

function displayPlaylist(tracks) {
    let container = document.getElementById('playlist-container');
    container.innerHTML = '';

    if (!tracks || tracks.length == 0) {
        container.innerHTML = "<p>No tracks found for the selected genres. Please try again with different genres.</p>"
    }

    tracks.forEach(track => {
        let trackElement = document.createElement('div');
        trackElement.classList.add('track');

        trackElement.innerHTML = `
        <img src="${track.album.images[0].url}" alt="Album Art" class="album-art">
        <div class="track-info">
            <h3>${track.name}</h3>
            <p>${track.artists.map(artist => artist.name).join(', ')}</p>
            <a href="${track.external_urls.spotify}" target="_blank">Listen on Spotify</a>
        </div>
        `;
        container.appendChild(trackElement);
    })
}

// TicketMaster API Logic
async function grabEvents(artist_name) {
    try {
        let fixed_artist = encodeURIComponent(artist_name);
        console.log(fixed_artist);
        const response = await fetch(
            `https://whispering-meadow-56072-ba39b0cc37be.herokuapp.com/events?artist=${fixed_artist}`
        );

        if (!response.ok) {
            displayAllEvents([]);
            console.error("Error fetching events:", error);
            return;
        }
    
        const data = await response.json();

        if (data._embedded && data._embedded.events) {
            displayAllEvents(data._embedded.events);
        } else {
            displayAllEvents([]);
        }

    } catch (error) {
        console.error("Error fetching events:", error);
        displayAllEvents([]);
    }
}

function displayAllEvents(events) {
    let eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = "";

    if (events.length == 0) {
        eventsContainer.innerHTML = `
        <div class="no-events-card">
        <h2> No Upcoming Events </h2>
        <p>We're sorry, but there are no scheduled events for this artist at the moment. Please check back later!</p>
        <img src="images/no-events-pic.jpg" alt="No Events Found" class="no-events-image">
        </div>
        `;
        return;
    }

    events.forEach(event => {
        let next_event = document.createElement("div");
        next_event.classList.add("event-card");

        next_event.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Date:</strong> ${new Date(event.dates.start.localDate).toDateString()}</p>
        <p><strong>Venue:</strong> ${event._embedded.venues[0].name}</p>
        <a href="${event.url}" target=_blank>Buy Tickets</a>`;

        eventsContainer.appendChild(next_event);
    });
}

document.getElementById("playlist-container").addEventListener("click", (event) => {
    let artist_card = event.target.closest(".track");
    if (!artist_card) {
        return;
    }

    let artist_name = artist_card.querySelector(".track-info p").textContent.split(",")[0].trim();
    console.log(artist_name);

    scrollToSection("events-section");
    grabEvents(artist_name);
})
