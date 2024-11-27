// Global variables
let current_section = 'header-section';
let all_sections = ['header-section', 'signup-section', 'genre-section', 'playlist-section', 'events-section', 'story-section', 'testimonials-section'];
let selectedGenres = [];


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
    let header = document.getElementById('genre-select-header');
    if (selectedGenres.length === 0) {
            header.innerHTML = "Please select at least one genre!";
            return;
    }

    try {
        header.innerHTML = "Select Your Favorite Genres";
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

      function shuffleTracks(track_array) {
        for (let i = track_array.length - 1; i > 0; i--) {
            let rand_index = Math.floor(Math.random() * (i + 1));
            [track_array[i], track_array[rand_index]] = [track_array[rand_index], track_array[i]];
        }
      }

      shuffleTracks(unique)

      let final_tracks = unique.slice(0, 12);
      displayPlaylist(final_tracks);
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
        <img src="${track.album.images[0] ? track.album.images[0].url : 'images/no-album-cover.png'}" alt="Album Art" class="album-art">
        <div class="track-info">
            <h3>${track.name}</h3>
            <p>${track.artists.map(artist => artist.name).join(', ')}</p>
            <a href="${track.external_urls.spotify}" target="_blank">Listen on Spotify</a>
        </div>
        `;
        container.appendChild(trackElement);
    })
}


document.addEventListener("DOMContentLoaded", async function() {
    let is_mobile = false;
    let all_genre_container = document.getElementById("genre-pills");
    let more_button = document.getElementById("show-more");
    let all_pills = [];

    async function load_genres() {
        try {
            let response = await fetch("genres.json");
            let found_genres = await response.json();

            found_genres.forEach(next_genre => {
                let next_pill = document.createElement("span");
                next_pill.classList.add("genre-pill");
                next_pill.setAttribute("data-value", next_genre.toLowerCase().replace(/ /g, "_"));
                next_pill.textContent = next_genre;

                next_pill.addEventListener("click", () => toggle_genre(next_pill));
                all_genre_container.appendChild(next_pill);
            });

            all_pills = document.querySelectorAll(".genre-pill");
            update_vis_pills();
        } catch (error) {
            console.log("Unable to fetch genres!");
        }
    }
    function toggle_genre(pill) {
        let next_genre = pill.getAttribute("data-value");

        if (selectedGenres.includes(next_genre)) {
            selectedGenres = selectedGenres.filter(selected => selected != next_genre);
            pill.classList.remove("selected");
        } else {
            selectedGenres.push(next_genre);
            pill.classList.add("selected");
        }
    }

    function update_vis_pills() {
        if (window.innerWidth < 768) {
            let hidden_pills = Array.from(all_pills).slice(10);
            hidden_pills.forEach(pill => {
                pill.style.display = is_mobile ? "inline-block" : "none";
            });

            more_button.style.display = "block";
            more_button.textContent = is_mobile ? "Show Less" : "Show More";
        } else {
            all_pills.forEach(pill => pill.style.display = "inline-block");
            more_button.style.display = "none";
            is_mobile = false;
        }
    }

    more_button.addEventListener("click", () => {
        is_mobile = !is_mobile;
        update_vis_pills();
    });

    window.addEventListener("resize", update_vis_pills);
    load_genres();
});

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
        eventsContainer.classList.add('no-events');
        eventsContainer.innerHTML = `
        <div class="no-events-card">
        <h3>No Upcoming Events</h3>
        <p>We're sorry, but there are no scheduled events for this artist at the moment. Please check back later!</p>
        </div>
        `;
        return;
    }

    eventsContainer.classList.remove('no-events');

    events.forEach(event => {
        let next_event = document.createElement("div");
        let next_image = event.images?.[0]?.url;
        next_event.classList.add("event-card");

        let found_url = null;

        if (event.url && !event.url.includes("undefined")) {
            found_url = event.url;
        }

        let button_text = "";
        if (found_url) {
            button_text = `<button onclick="window.open('${found_url}', '_blank')">Buy Tickets</button>`;
        } else {
            button_text = `<button disabled style="cursor: not-allowed; opacity: 0.6;">Tickets Not Available</button>`;
        }

        next_event.innerHTML = `
        <img src="${next_image}" alt="${event.name}" class="event-image">
        <h3>${event.name}</h3>
        <p> ${new Date(event.dates.start.localDate).toDateString()}</p>
        <p> ${event._embedded.venues[0].name}</p>
        ${button_text}`;

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