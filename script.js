function checkHumidity() {
    const location = document.getElementById('locationInput').value;
    const apiKey = '7f809748ab';  // Je eigen API-key
    const url = `https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${encodeURIComponent(location)}&callback=?`;

    fetchJsonp(url)
        .then(response => response.json())
        .then(data => {
            const weerdata = data.liveweer[0];
            const temp = weerdata.temp;
            const luchtvochtigheid = weerdata.lv;
            const samenvatting = weerdata.samenv;
            const resultElement = document.getElementById('weatherResult');
            const summaryElement = document.getElementById('weatherSummary');

            // Update the page with the weather summary
            summaryElement.textContent = `Weeroverzicht: ${samenvatting}`;

            // Check if it's humid based on temperature and humidity
            if (parseInt(luchtvochtigheid) > 70 && parseInt(temp) > 20) {
                resultElement.textContent = 'Ja, het is benauwd buiten!';
            } else {
                resultElement.textContent = 'Nee, het is niet benauwd buiten.';
            }
        })
        .catch(error => {
            console.error('Error fetching the weather data:', error);
            document.getElementById('weatherResult').textContent = 'Fout bij het ophalen van de weergegevens.';
        });
}

// Function to handle JSONP requests
function fetchJsonp(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const id = `jsonp_${new Date().getTime()}`;
        window[id] = (data) => {
            resolve({ ok: true, json: () => Promise.resolve(data) });
            script.remove();
            delete window[id];
        };

        script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${id}`;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
