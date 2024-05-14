let choices;

document.addEventListener('DOMContentLoaded', function() {
    requestLocation();
    populateDropdown();
});

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
    choices = new Choices(placeSelect, {
        searchEnabled: true,
        shouldSort: false,
        placeholderValue: 'Selecteer een plaats',
        noResultsText: 'Geen resultaten gevonden'
    });
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
    loadingSpin.style.display = 'block'; // Show the loading spinner

    let location;
    if (isGeolocation) {
        location = `${lat},${lon}`; // Use coordinates if it's a geolocation request
    } else {
        location = document.getElementById('placeSelect').value;
    }
    const apiKey = '7f809748ab';   // Your API key here
    const url = `https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${encodeURIComponent(location)}&format=json`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.liveweer && data.liveweer.length > 0) {
                const weerdata = data.liveweer[0];
                const temp = parseInt(weerdata.temp);
                const luchtvochtigheid = parseInt(weerdata.lv);
                const resultElement = document.getElementById('weatherResult');
                const locationNameElement = document.getElementById('locationName');

                const benauwdheidIndex = determineHumidityLevel(temp, luchtvochtigheid);
                resultElement.textContent = describeHumidityLevel(benauwdheidIndex);
                locationNameElement.textContent = `Locatie: ${isGeolocation ? data.liveweer[0].plaats : location}`; // Display location name

                loadingSpin.style.display = 'none'; // Hide the loading spinner
            } else {
                document.getElementById('weatherResult').textContent = 'Geen weergegevens gevonden.';
                loadingSpin.style.display = 'none'; // Hide the loading spinner
            }
        })
        .catch(error => {
            console.error('Error fetching the weather data:', error);
            document.getElementById('weatherResult').textContent = 'Fout bij het ophalen van de weergegevens.';
            loadingSpin.style.display = 'none'; // Hide the loading spinner
        });
}

function determineHumidityLevel(temperature, humidity) {
    if (humidity > 70) {
        return 'high';
    } else if (humidity > 50) {
        return 'moderate';
    } else {
        return 'low';
    }
}

function describeHumidityLevel(humidityLevel) {
    switch (humidityLevel) {
        case 'high':
            return 'Pas op! Het is erg benauwd buiten.';
        case 'moderate':
            return 'Het is benauwd buiten.';
        case 'low':
            return 'Het is niet benauwd.';
        default:
            return 'Het is niet benauwd.';
    }
}
