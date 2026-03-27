const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('sd-token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401 && token) {
        // Try refreshing
        const refreshToken = localStorage.getItem('sd-refresh-token');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    localStorage.setItem('sd-token', data.accessToken);
                    localStorage.setItem('sd-refresh-token', data.refreshToken);

                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    const retry = await fetch(url, { ...options, headers });
                    const retryData = await retry.json();
                    if (!retry.ok) throw new Error(retryData.error || 'Request failed');
                    return retryData;
                }
            } catch (e) {
                localStorage.removeItem('sd-token');
                localStorage.removeItem('sd-refresh-token');
                localStorage.removeItem('sd-seller');
                if (typeof window !== 'undefined') {
                    window.location.href = '/seller/login';
                }
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
