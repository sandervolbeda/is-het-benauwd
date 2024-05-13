document.addEventListener('DOMContentLoaded', function() {
    requestLocation();
    fillLocationDropdown(); // Fill the dropdown with location names
});

// Function to fill the dropdown with location names
function fillLocationDropdown() {
    fetch('https://metatopos.dijkewijk.nl/metatopos-places.json')
        .then(response => response.json())
        .then(data => {
            const locationSelect = document.getElementById('locationSelect');
            data.forEach(place => {
                const option = document.createElement('option');
                option.value = place.name;
                option.textContent = place.name;
                locationSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching location data:', error));
}

// Function to display current location
function displayCurrentLocation(locationName) {
    const currentLocationParagraph = document.getElementById('currentLocation');
    const locationIcon = document.getElementById('locationIcon');
    const locationNameSpan = document.getElementById('locationName');
    const loadingIcon = document.getElementsByClassName('spinner')[0];

    locationNameSpan.textContent = locationName;
    locationIcon.style.display = 'inline'; // Show the location icon
    loadingIcon.style.display = 'none'; // Hide the loading icon
}

// Function to check if geolocation is supported and get the user's current position
function requestLocation() {
    if (navigator.geolocation) {
        const locationIcon = document.getElementById('locationIcon');
        const loadingIcon = document.getElementsByClassName('spinner')[0];

        locationIcon.style.display = 'none'; // Hide the location icon
        loadingIcon.style.display = 'inline'; // Show the loading icon

        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`Latitude: ${lat}, Longitude: ${lon}`); // Log the user's location to the console
            checkHumidity(lat, lon); // Call checkHumidity function with coordinates
        }, function() {
            console.error('Geolocation is denied or not available');
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

// Function to check humidity based on coordinates
function checkHumidity(lat, lon) {
    const location = document.getElementById('locationSelect').value;
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

                const benauwdheidIndex = determineHumidityLevel(temp, luchtvochtigheid);
                resultElement.textContent = describeHumidityLevel(benauwdheidIndex);
            } else {
                document.getElementById('weatherResult').textContent = 'Geen weergegevens gevonden.';
            }
        })
        .catch(error => {
            console.error('Error fetching the weather data:', error);
            document.getElementById('weatherResult').textContent = 'Fout bij het ophalen van de weergegevens.';
        });
}

// Function to determine the humidity level
function determineHumidityLevel(temperature, humidity) {
    // Logic to determine humidity level based on temperature and humidity
    // You can define your own logic here
    // For example:
    if (humidity > 70) {
        return 'high';
    } else if (humidity > 50) {
        return 'moderate';
    } else {
        return 'low';
    }
}

// Function to describe the humidity level to the user
function describeHumidityLevel(humidityLevel) {
    // Logic to describe humidity level to the user
    // You can define your own descriptions here
    // For example:
    switch (humidityLevel) {
        case 'high':
            return 'Het is erg benauwd buiten.';
        case 'moderate':
            return 'Het is redelijk benauwd buiten.';
        case 'low':
            return 'Het is niet erg benauwd buiten.';
        default:
            return 'Het is niet erg benauwd buiten.';
    }
}
