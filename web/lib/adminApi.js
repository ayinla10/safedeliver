const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function adminRequest(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('sd-admin-token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && token) {
        const refreshToken = localStorage.getItem('sd-admin-refresh');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    localStorage.setItem('sd-admin-token', data.accessToken);
                    localStorage.setItem('sd-admin-refresh', data.refreshToken);
                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    const retry = await fetch(url, { ...options, headers });
                    const retryData = await retry.json();
                    if (!retry.ok) throw new Error(retryData.error || 'Request failed');
                    return retryData;
                }
            } catch {
                localStorage.removeItem('sd-admin-token');
                localStorage.removeItem('sd-admin-refresh');
            }
        }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const adminApi = {
    get: (endpoint) => adminRequest(endpoint),
    post: (endpoint, body) => adminRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint, body) => adminRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint) => adminRequest(endpoint, { method: 'DELETE' }),
};
