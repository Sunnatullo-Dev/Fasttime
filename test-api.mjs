import fetch from 'node-fetch';

async function testBackend() {
    const BASE_URL = 'http://localhost:3000/api';

    // 1. Login with test account
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'sunat', password: '123' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const authData = await loginRes.json();
    const token = authData.token;

    console.log('Login successful, testing profile...');

    const endpointKeys = ['/auth/profile', '/stats/daily', '/stats/weekly?days=7', '/stats/history', '/stats/heatmap', '/auth/achievements', '/launch/referrals'];

    for (const ep of endpointKeys) {
        const res = await fetch(`${BASE_URL}${ep}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`[${res.ok ? 'OK' : 'ERROR'}] ${res.status} ${ep}`);
        if (!res.ok) {
            console.log('Error content:', await res.text());
        }
    }
}

testBackend();
