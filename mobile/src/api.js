import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api/v1'; // Android emulator → localhost
// For iOS simulator use: 'http://localhost:5000/api/v1'
// For physical device, use your computer's LAN IP

async function request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('sd-token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401 && token) {
        const refreshToken = await AsyncStorage.getItem('sd-refresh-token');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    await AsyncStorage.setItem('sd-token', data.accessToken);
                    await AsyncStorage.setItem('sd-refresh-token', data.refreshToken);
                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    const retry = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
                    const retryData = await retry.json();
                    if (!retry.ok) throw new Error(retryData.error || 'Request failed');
                    return retryData;
                }
            } catch {
                await AsyncStorage.multiRemove(['sd-token', 'sd-refresh-token', 'sd-seller']);
            }
        }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const api = {
    get: (endpoint) => request(endpoint),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
