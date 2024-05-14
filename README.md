# Opzetten van Github pages voor een side-project

Install 'npm install' when you start the project

Compile all css: 'npx tailwindcss build styles.css -o output.css'

Watch: npm run watch:css

Fetch locations from URL 'npm node-fetch'

This requires local SSL certification. Run HTTP server 'npm start' to make sure all locations are loaded URL 'https://192.168.2.185:443'

Background image: https://unsplash.com/photos/green-trees-covered-with-fog-lDy1K7RkLeA

## SSL
# Maak een sleutelbestand
openssl genrsa -out key.pem

# Maak een certificaatondertekeningsverzoek (CSR)
openssl req -new -key key.pem -out csr.pem

# Maak een zelfondertekend certificaat
openssl x509 -req -days 9999 -in csr.pem -signkey key.pem -out cert.pem

# Ruim het CSR-bestand op
rm csr.pem