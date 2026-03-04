const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('WEB CONSOLE:', msg.text()));
    page.on('pageerror', error => console.error('WEB ERROR:', error));

    await page.goto('http://localhost:3000');

    await page.waitForTimeout(2000);

    // Login
    try {
        await page.fill('input[type="text"]', 'sunat');
        await page.fill('input[type="password"]', '123');
        await page.click('button[type="submit"]');
    } catch (e) {
        console.log("Login form not found, maybe already logged in.");
    }

    await page.waitForTimeout(3000);

    // Print all button texts to verify UI loaded
    const buttons = await page.$$eval('button', els => els.map(e => e.innerText));
    console.log("Buttons found:", buttons.map(b => b.replace(/\n/g, ' ').trim()).filter(b => b));

    // Go to Profile (Profil)
    await page.evaluate(() => {
        const tabs = document.querySelectorAll('button');
        for (let tab of tabs) {
            if (tab.textContent.includes('Profil') || tab.textContent.includes('PROFIL')) {
                tab.click();
            }
        }
    });

    await page.waitForTimeout(2000);

    // Scrape ErrorBoundary if it exists
    const errText = await page.evaluate(() => {
        const errObj = document.querySelector('.bg-red-900\\/50');
        return errObj ? errObj.innerText : 'No error boundary shown for Profile';
    });
    console.log("PROFILE RESULT:\n", errText);

    // Go to Dashboard (Analitika)
    await page.evaluate(() => {
        const tabs = document.querySelectorAll('button');
        for (let tab of tabs) {
            if (tab.textContent.includes('Analitika') || tab.textContent.includes('ANALITIKA')) {
                tab.click();
            }
        }
    });

    await page.waitForTimeout(2000);

    const errText2 = await page.evaluate(() => {
        const errObj = document.querySelector('.bg-red-900\\/50');
        return errObj ? errObj.innerText : 'No error boundary shown for Analitika';
    });
    console.log("ANALITIKA RESULT:\n", errText2);

    await browser.close();
})();
