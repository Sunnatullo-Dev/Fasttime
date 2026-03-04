const fs = require('fs');
const https = require('https');
const path = require('path');

const countries = [
    'AF', 'AL', 'DZ', 'AD', 'AO', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BH', 'BD', 'BY', 'BE', 'BR', 'BG', 'CA', 'CL', 'CN', 'CO', 'HR', 'CY', 'CZ', 'DK', 'EG', 'EE', 'FI', 'FR', 'GE', 'DE', 'GR', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JP', 'JO', 'KZ', 'KE', 'KR', 'KW', 'KG', 'LV', 'LB', 'LY', 'LT', 'LU', 'MY', 'MT', 'MX', 'MD', 'MC', 'MN', 'ME', 'MA', 'NL', 'NZ', 'NG', 'NO', 'OM', 'PK', 'PS', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'SA', 'RS', 'SG', 'SK', 'SI', 'ZA', 'ES', 'LK', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TH', 'TN', 'TR', 'TM', 'UA', 'AE', 'GB', 'US', 'UZ', 'VN'
];

const destDir = path.join(__dirname, '..', 'src', 'assets', 'flags');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

async function download(code) {
    const filename = code.toLowerCase() + '.svg';
    const filePath = path.join(destDir, filename);
    const url = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code.toUpperCase()}.svg`;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                console.error(`Failed to download ${code}: ${response.statusCode}`);
                file.close();
                fs.unlink(filePath, () => { }); // Delete the empty file
                resolve();
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${code}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { });
            console.error(`Error downloading ${code}: ${err.message}`);
            resolve();
        });
    });
}

async function start() {
    for (const code of countries) {
        await download(code);
        // Add a small delay to be nice to the server
        await new Promise(r => setTimeout(r, 100));
    }
}

start();
