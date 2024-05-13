function checkHumidity() {
    const location = 'Groningen';  // Vaste locatie ingesteld op Groningen
    const apiKey = '7f809748ab';   // Je eigen API-key
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

function determineHumidityLevel(temp, humidity) {
    if (humidity <= 50) return 1;
    if (humidity > 50 && humidity <= 60) return 2;
    if (humidity > 60 && humidity <= 70) {
        if (temp > 25) return 4;
        return 3;
    }
    if (humidity > 70 && humidity <= 80) {
        if (temp > 25) return 5;
        return 4;
    }
    return 5;
}

function describeHumidityLevel(level) {
    switch (level) {
        case 1: return 'Geen benauwdheid - Je voelt je helemaal vrij, geen moeite met ademen.';
        case 2: return 'Lichte benauwdheid - Je merkt een klein beetje moeite met ademen, maar het is niet storend.';
        case 3: return 'Matige benauwdheid - Je voelt een duidelijke verstoring in je ademhaling. Het kan je dagelijkse activiteiten licht beïnvloeden.';
        case 4: return 'Ernstige benauwdheid - Het ademen is moeilijk en beïnvloedt duidelijk je dagelijkse activiteiten.';
        case 5: return 'Zeer ernstige benauwdheid - Ademen is zeer moeilijk. Ga voorbereid op pad.';
        default: return 'Onbekende benauwdheidsniveau.';
    }
}
