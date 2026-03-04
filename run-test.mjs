import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

        await page.goto('http://localhost:3000');

        // Let it load
        await new Promise(r => setTimeout(r, 2000));

        // Log in
        console.log("Typing username...");
        await page.type('input[type="text"]', 'sunat');
        await page.type('input[type="password"]', '123');
        await page.click('button[type="submit"]');

        await new Promise(r => setTimeout(r, 2000));

        // Click Profil
        console.log("Clicking Profile tab...");
        await page.evaluate(() => {
            const tabs = document.querySelectorAll('button');
            for (let tab of tabs) {
                if (tab.textContent.includes('PROFIL') || tab.textContent.includes('Profil')) {
                    tab.click();
                }
            }
        });

        await new Promise(r => setTimeout(r, 2000));

        // Click Dashboard
        console.log("Clicking Analytics tab...");
        await page.evaluate(() => {
            const tabs = document.querySelectorAll('button');
            for (let tab of tabs) {
                if (tab.textContent.includes('ANALITIKA') || tab.textContent.includes('Analitika')) {
                    tab.click();
                }
            }
        });

        await new Promise(r => setTimeout(r, 2000));

        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
