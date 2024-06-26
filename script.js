let choices;
let sunriseTime, sunsetTime, sunriseEndTime, sunsetEndTime;

document.addEventListener('DOMContentLoaded', async function() {
    // Stel een standaard gradient in
    document.body.className = 'night-gradient';
    const gradientOverlay = document.getElementById('gradient-overlay');
    gradientOverlay.style.opacity = '0';

    // Wacht een moment om de standaard gradient te laten zien
    await new Promise(resolve => setTimeout(resolve, 100));

    await requestLocation();
    await populateDropdown();

    // Voeg deze regel toe om de tijd en datum direct te initialiseren
    updateTimeAndDate();

    // Voeg deze regel toe om de tijd elke minuut te updaten
    setInterval(updateTimeAndDate, 60000);

    // Voeg deze regel toe om de gradient elk uur bij te werken
    setInterval(setGradient, 3600000);

    // Add event listener to the changeLocation span
    const changeLocation = document.getElementById('changeLocation');
    if (changeLocation) {
        changeLocation.addEventListener('click', function() {
            document.getElementById('locationName').style.display = 'none';
            document.getElementById('dropdownContainer').style.display = 'block';
            this.style.display = 'none'; // Hide the span
        });
    }
});

function setDefaultGradient() {
    document.body.style.background = 'linear-gradient(to bottom, #25282E, #22384F, #1C526A)';
}

function updateTimeAndDate() {
    const now = new Date();

    // Nederlandse tijd (CET/CEST)
    const optionsTime = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' };
    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Amsterdam' };

    const time = now.toLocaleTimeString('nl-NL', optionsTime);
    const date = now.toLocaleDateString('nl-NL', optionsDate);

    document.getElementById('showTime').textContent = time;
    document.getElementById('showDate').textContent = date;
}

async function populateDropdown() {
    try {
        const response = await fetch('places.json'); // Zorg dat dit lokaal pad correct is
        const places = await response.json();

        const placeSelect = document.getElementById('placeSelect');
        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place;
            option.textContent = place;
            placeSelect.appendChild(option);
        });

        initializeChoices(); // Initialize Choices after populating the dropdown

        // Add event listener for place selection change
        placeSelect.addEventListener('change', function() {
            const selectedPlace = placeSelect.value;
            const locationNameElement = document.getElementById('locationName');
            locationNameElement.textContent = `Locatie: ${selectedPlace}`;
            checkHumidity(null, null, false); // Update weather info based on new selection
        });

    } catch (error) {
        console.error('Error fetching places:', error);
    }
}

function initializeChoices() {
    const placeSelect = document.getElementById('placeSelect');
    if (placeSelect) {
        choices = new Choices(placeSelect, {
            searchEnabled: true,
            shouldSort: false,
            placeholderValue: 'Selecteer een plaats',
            noResultsText: 'Geen resultaten gevonden'
        });
    }
}

function setDropdownValue(locationName) {
    if (choices) {
        choices.removeActiveItems(); // Clear current selection
        choices.setChoiceByValue(locationName); // Set new selection
    }
}

async function getSunTimes(lat, lon) {
    const apiKey = '7f809748ab'; // Your API key here
    const url = `https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${lat},${lon}&format=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.liveweer && data.liveweer.length > 0) {
            const sunriseStr = data.liveweer[0].sup;
            const sunsetStr = data.liveweer[0].sunder;

            // Assuming sunrise and sunset are given in hh:mm format
            const [sunriseHour, sunriseMinute] = sunriseStr.split(':').map(Number);
            const [sunsetHour, sunsetMinute] = sunsetStr.split(':').map(Number);

            const today = new Date();
            sunriseTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sunriseHour, sunriseMinute);
            sunsetTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sunsetHour, sunsetMinute);
            sunriseEndTime = new Date(sunriseTime.getTime() + 3600000); // Assuming sunrise lasts 1 hour
            sunsetEndTime = new Date(sunsetTime.getTime() + 3600000); // Assuming sunset lasts 1 hour

            console.log('Sunrise time:', sunriseTime);
            console.log('Sunset time:', sunsetTime);
            console.log('Sunrise end time:', sunriseEndTime);
            console.log('Sunset end time:', sunsetEndTime);

            setGradient(); // Call setGradient() after fetching sun times
        }
    } catch (error) {
        console.error('Error fetching sun times:', error);
    }
}

function setGradient() {
    const now = new Date();

    console.log('Current time:', now);
    console.log('Sunrise time:', sunriseTime);
    console.log('Sunrise end time:', sunriseEndTime);
    console.log('Sunset time:', sunsetTime);
    console.log('Sunset end time:', sunsetEndTime);

    const gradientOverlay = document.getElementById('gradient-overlay');
    gradientOverlay.classList.remove('sunrise-gradient', 'day-gradient', 'sunset-gradient', 'night-gradient');

    let gradientClass;

    if (sunriseTime && sunsetTime) {
        if (now >= sunriseTime && now < sunriseEndTime) {
            console.log('Setting gradient for Sunrise');
            gradientClass = 'sunrise-gradient';
        } else if (now >= sunriseEndTime && now < sunsetTime) {
            console.log('Setting gradient for Day');
            gradientClass = 'day-gradient';
        } else if (now >= sunsetTime && now < sunsetEndTime) {
            console.log('Setting gradient for Sunset');
            gradientClass = 'sunset-gradient';
        } else {
            console.log('Setting gradient for Night');
            gradientClass = 'night-gradient';
        }
    } else {
        console.log('Setting default gradient');
        gradientClass = 'night-gradient';
    }

    // Apply the new gradient class to the body immediately
    document.body.className = gradientClass;

    // Add a slight delay before updating the overlay to allow CSS transition to catch up
    setTimeout(() => {
        gradientOverlay.classList.add(gradientClass);
        gradientOverlay.style.opacity = '1';

        // Hide the overlay after the transition
        setTimeout(() => {
            gradientOverlay.style.opacity = '0';
        }, 2000); // Match this duration with the CSS transition duration
    }, 50); // Adjust this delay if necessary
}


async function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`Latitude: ${lat}, Longitude: ${lon}`); // Log the user's location to the console

            await getSunTimes(lat, lon); // Fetch sunrise and sunset times
            const locationName = await getLocationName(lat, lon);
            setDropdownValue(locationName); // Set the dropdown value to the detected location
            checkHumidity(lat, lon, true); // Call checkHumidity function with coordinates and indicate it's a geolocation request
        }, function(error) {
            console.error('Geolocation is denied or not available', error.message);
            alert('Geolocation is denied or not available. Please enable it to use this feature.');
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
        alert('Geolocation is not supported by this browser.');
    }
}

async function getLocationName(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.address.city || data.address.town || data.address.village || 'Unknown';
    } catch (error) {
        console.error('Error fetching location name:', error);
        return 'Unknown';
    }
}

function calculateBreathlessnessIndex(temp, humidity, pressure, windSpeed, rainChance) {
    const normalizedTemp = (temp - 10) / 30;
    const normalizedHumidity = humidity / 100;
    const normalizedPressure = (pressure - 950) / 100;
    const normalizedWindSpeed = windSpeed / 20;
    const normalizedRainChance = !isNaN(rainChance) ? rainChance / 100 : 0;

    console.log(`Normalized Temp: ${normalizedTemp}`);
    console.log(`Normalized Humidity: ${normalizedHumidity}`);
    console.log(`Normalized Pressure: ${normalizedPressure}`);
    console.log(`Normalized Wind Speed: ${normalizedWindSpeed}`);
    console.log(`Normalized Rain Chance: ${normalizedRainChance}`);

    const weightTemp = 0.3;
    const weightHumidity = 0.3;
    const weightPressure = 0.2;
    const weightWindSpeed = 0.1;
    const weightRainChance = 0.1;

    const index = (normalizedTemp * weightTemp) +
                  (normalizedHumidity * weightHumidity) +
                  ((1 - normalizedPressure) * weightPressure) +
                  ((1 - normalizedWindSpeed) * weightWindSpeed) +
                  ((1 - normalizedRainChance) * weightRainChance);

    console.log(`Calculated Index (before scaling): ${index}`);

    // Scale the index to a value between 1 and 5
    let scaledIndex = (index * 4) + 1;

    // Round to the nearest 0.5
    scaledIndex = Math.round(scaledIndex * 2) / 2;

    console.log(`Scaled Index (after rounding to nearest 0.5): ${scaledIndex}`);
    return scaledIndex;
}


function describeBreathlessnessLevel(index) {
    if (index === 1) {
        return 'Niet benauwd.';
    } else if (index === 2) {
        return 'Matig benauwd.';
    } else if (index === 3) {
        return 'Benauwd.';
    } else if (index === 4) {
        return 'Ernstige benauwdheid.';
    } else if (index === 5) {
        return 'Extreme benauwdheid.';
    } else {
        return 'Geen resultaat';
    }
}

function checkHumidity(lat, lon, isGeolocation = false) {
    const loadingSpin = document.getElementById('loadingSpin');
    const resultElement = document.getElementById('weatherResult');
    const scoreElement = document.getElementById('weatherScore');
    const weatherDescription = document.getElementById('weatherDescription');
    const weatherImageContainer = document.getElementById('weatherImageContainer');
    const tempElement = document.getElementById('showTemp');

    
    if (!loadingSpin || !resultElement || !scoreElement || !weatherDescription || !weatherImageContainer || !tempElement) {
        console.error('One or more elements not found in the DOM');
        return;
    }

    loadingSpin.style.display = 'flex';
    resultElement.style.display = 'none';
    scoreElement.style.display = 'none';
    weatherDescription.style.display = 'none';

    let location;
    if (isGeolocation) {
        location = `${lat},${lon}`;
    } else {
        location = document.getElementById('placeSelect').value;
    }
    const apiKey = '7f809748ab';
    const url = `https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${encodeURIComponent(location)}&format=json`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.liveweer && data.liveweer.length > 0) {
                const weerdata = data.liveweer[0];
                const temp = parseInt(weerdata.temp);
                const humidity = parseInt(weerdata.lv);
                const pressure = parseInt(weerdata.luchtd);
                const windSpeed = parseInt(weerdata.windkmh);
                const rainChance = weerdata.neersl_perc_dag ? parseInt(weerdata.neersl_perc_dag) : 0;
                const weatherSummary = weerdata.samenv;

                tempElement.textContent = `${temp} °C`;

                const breathlessnessIndex = calculateBreathlessnessIndex(temp, humidity, pressure, windSpeed, rainChance);
                const description = describeBreathlessnessLevel(breathlessnessIndex);

                resultElement.textContent = description;
                scoreElement.textContent = `Score: ${breathlessnessIndex}`;

                const locationNameElement = document.getElementById('locationName');
                if (locationNameElement) {
                    locationNameElement.textContent = `Locatie: ${isGeolocation ? data.liveweer[0].plaats : location}`;
                }

                weatherDescription.textContent = `${weatherSummary}`;
                weatherDescription.style.display = 'block';

                document.querySelectorAll('#weatherImageContainer img').forEach(img => {
                    img.style.display = 'none';
                });

                const now = new Date();
                const currentTime = now.getTime();

                let weatherImage = '';
                if (currentTime >= sunsetTime.getTime() || currentTime < sunriseTime.getTime()) {
                    weatherImage = 'moon';
                } else if (weatherSummary.includes('onbewolkt') || weatherSummary.includes('zonnig')) {
                    weatherImage = 'sun';
                } else if (weatherSummary.includes('regen') || weatherSummary.includes('motregen')) {
                    weatherImage = 'rain';
                } else {
                    weatherImage = 'cloud';
                }

                const weatherImageElement = document.querySelector(`#weatherImageContainer img[alt="${weatherImage}"]`);
                if (weatherImageElement) {
                    weatherImageElement.style.display = 'block';
                }

                loadingSpin.style.display = 'none';
                resultElement.style.display = 'block';
                scoreElement.style.display = 'block';
            } else {
                resultElement.textContent = 'Geen weergegevens gevonden.';
                loadingSpin.style.display = 'none';
                resultElement.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching the weather data:', error);
            resultElement.textContent = 'Fout bij het ophalen van de weergegevens.';
            loadingSpin.style.display = 'none';
            resultElement.style.display = 'block';
        });
}

