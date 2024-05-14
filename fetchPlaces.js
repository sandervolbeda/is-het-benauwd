const axios = require('axios');
const fs = require('fs');

// Function to fetch places JSON and extract unique "place" names
async function fetchPlaces() {
    try {
        // Fetch places JSON from the provided URL
        const response = await fetch('https://metatopos.dijkewijk.nl/metatopos-places.json');
        const data = await response.json();

        // Extract unique "place" names from the fetched data
        const uniquePlaceNames = Array.from(new Set(data.places.map(place => place.place)));

        // Return the array of unique "place" names
        return uniquePlaceNames;
    } catch (error) {
        console.error('Error fetching places:', error);
        return [];
    }
}

// Function to save place names to a JSON file
function savePlacesToFile(placeNames) {
    try {
        // Write the place names to a JSON file
        fs.writeFileSync('places.json', JSON.stringify(placeNames, null, 2));
        console.log('Place names saved to places.json file successfully.');
    } catch (error) {
        console.error('Error saving place names to file:', error);
    }
}

// Fetch unique place names and save them to file
fetchPlaces()
    .then(uniquePlaceNames => savePlacesToFile(uniquePlaceNames))
    .catch(error => console.error('Error:', error));
