let choices;

document.addEventListener('DOMContentLoaded', function() {
    requestLocation();
    populateDropdown();
    setGradient(); // Set initial gradient when the DOM content is loaded
    setInterval(setGradient, 3600000); // Update gradient every hour

    // Voeg deze regel toe om de tijd en datum direct te initialiseren
    updateTimeAndDate();

    // Voeg deze regel toe om de tijd elke seconde te updaten
    setInterval(updateTimeAndDate, 1000); 

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

function requestLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`Latitude: ${lat}, Longitude: ${lon}`); // Log the user's location to the console

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

function checkHumidity(lat, lon, isGeolocation = false) {
    const loadingSpin = document.getElementById('loadingSpin');
    const resultElement = document.getElementById('weatherResult');
    const scoreElement = document.getElementById('weatherScore');
    
    loadingSpin.style.display = 'flex'; // Show the loading spinner
    resultElement.style.display = 'none'; // Hide the weather result
    scoreElement.style.display = 'none'; // Hide the weather score

    let location;
    if (isGeolocation) {
        location = `${lat},${lon}`; // Use coordinates if it's a geolocation request
    } else {
        location = document.getElementById('placeSelect').value;
    }
    const apiKey = '7f809748ab'; // Your API key here
    const url = `https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${encodeURIComponent(location)}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.liveweer && data.liveweer.length > 0) {
                const weerdata = data.liveweer[0];
                const temp = parseInt(weerdata.temp);
                const humidity = parseInt(weerdata.lv);
                const pressure = parseInt(weerdata.luchtd);
                const windSpeed = parseInt(weerdata.windkmh);
                const rainChance = weerdata.neersl_perc_dag ? parseInt(weerdata.neersl_perc_dag) : 0; // Fallback to 0 if rainChance is not available

                console.log(`Temp: ${temp}, Humidity: ${humidity}, Pressure: ${pressure}, Wind Speed: ${windSpeed}, Rain Chance: ${rainChance}`);
                
                const breathlessnessIndex = calculateBreathlessnessIndex(temp, humidity, pressure, windSpeed, rainChance);
                const description = describeBreathlessnessLevel(breathlessnessIndex);

                resultElement.textContent = description;
                scoreElement.textContent = `Score: ${breathlessnessIndex}`;

                const locationNameElement = document.getElementById('locationName');
                locationNameElement.textContent = `Locatie: ${isGeolocation ? data.liveweer[0].plaats : location}`; // Display location name

                loadingSpin.style.display = 'none'; // Hide the loading spinner
                resultElement.style.display = 'block'; // Show the weather result
                scoreElement.style.display = 'block'; // Show the weather score
            } else {
                resultElement.textContent = 'Geen weergegevens gevonden.';
                loadingSpin.style.display = 'none'; // Hide the loading spinner
                resultElement.style.display = 'block'; // Show the weather result
            }
        })
        .catch(error => {
            console.error('Error fetching the weather data:', error);
            resultElement.textContent = 'Fout bij het ophalen van de weergegevens.';
            loadingSpin.style.display = 'none'; // Hide the loading spinner
            resultElement.style.display = 'block'; // Show the weather result
        });
}

function calculateBreathlessnessIndex(temp, humidity, pressure, windSpeed, rainChance) {
    // Normaliseer de waarden tussen 0 en 1
    const normalizedTemp = (temp - 10) / 30; // Assuming temp ranges from 10 to 40 degrees Celsius
    const normalizedHumidity = humidity / 100; // Humidity as a percentage
    const normalizedPressure = (pressure - 950) / 100; // Assuming pressure ranges from 950 to 1050 hPa
    const normalizedWindSpeed = windSpeed / 20; // Assuming windSpeed ranges from 0 to 20 km/h
    const normalizedRainChance = !isNaN(rainChance) ? rainChance / 100 : 0; // Rain chance as a percentage

    console.log(`Temp: ${temp}, Normalized Temp: ${normalizedTemp}`);
    console.log(`Humidity: ${humidity}, Normalized Humidity: ${normalizedHumidity}`);
    console.log(`Pressure: ${pressure}, Normalized Pressure: ${normalizedPressure}`);
    console.log(`Wind Speed: ${windSpeed}, Normalized Wind Speed: ${normalizedWindSpeed}`);
    console.log(`Rain Chance: ${rainChance}, Normalized Rain Chance: ${normalizedRainChance}`);

    // Geef gewichten aan elke parameter
    const weightTemp = 0.4;
    const weightHumidity = 0.3;
    const weightPressure = 0.1;
    const weightWindSpeed = 0.1;
    const weightRainChance = 0.1;

    // Bereken de gewogen som
    const index = (normalizedTemp * weightTemp) +
                  (normalizedHumidity * weightHumidity) +
                  ((1 - normalizedPressure) * weightPressure) + // Lower pressure means higher breathlessness
                  ((1 - normalizedWindSpeed) * weightWindSpeed) + // Higher wind speed means lower breathlessness
                  ((1 - normalizedRainChance) * weightRainChance); // Higher rain chance means lower breathlessness

    console.log(`Calculated Index: ${index}`);

    // Schaal de index naar een schaal van 1 tot 10
    const scaledIndex = Math.round(index * 10);
    console.log(`Scaled Index: ${scaledIndex}`);
    return scaledIndex;
}

function describeBreathlessnessLevel(index) {
    switch(index) {
        case 1:
            return 'Geen benauwdheid.';
        case 2:
            return 'Bijna geen benauwdheid.';
        case 3:
            return 'Zeer milde benauwdheid.';
        case 4:
            return 'Milde benauwdheid.';
        case 5:
            return 'Lichte benauwdheid.';
        case 6:
            return 'Matige benauwdheid.';
        case 7:
            return 'Redelijke benauwdheid.';
        case 8:
            return 'Ernstige benauwdheid.';
        case 9:
            return 'Zeer ernstige benauwdheid.';
        case 10:
            return 'Extreme benauwdheid.';
        default:
            return 'Geen resultaat';
    }
}

function setGradient() {
    const now = new Date();
    const hours = now.getHours();
    let gradient;

    if (hours >= 5 && hours < 8) {
        // Early Morning: Dark Pink to Peach
        gradient = 'linear-gradient(to bottom, #ffb3ba, #ffdfba)';
    } else if (hours >= 8 && hours < 10) {
        // Morning: Blue to Yellow
        gradient = 'linear-gradient(to bottom, #00a8ff, #ffd700)';
    } else if (hours >= 10 && hours < 12) {
        // Late Morning: Yellow to Light Yellow
        gradient = 'linear-gradient(to bottom, #ffbb00, #ffd700)';
    } else if (hours >= 12 && hours < 15) {
        // Early Afternoon: Light Blue to Bright Blue
        gradient = 'linear-gradient(to bottom, #0072ff, #89f7fe)';
    } else if (hours >= 15 && hours < 18) {
        // Afternoon: Light Blue to Light Yellow
        gradient = 'linear-gradient(to bottom, #0072ff, #faaf40)';
    } else if (hours >= 18 && hours < 20) {
        // Early Evening: Pink to Orange
        gradient = 'linear-gradient(to bottom, #ff616f, #ff8a5c)';
    } else if (hours >= 20 && hours < 22) {
        // Evening: Orange to Pink
        gradient = 'linear-gradient(to bottom, #ff8a5c, #ff616f)';
    } else {
        // Night: Dark Purple to Pinkish
        gradient = 'linear-gradient(to bottom, #2E0854, #191654)';
    }

    document.body.style.background = gradient; 
}
