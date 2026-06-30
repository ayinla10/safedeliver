const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function clearAdminSession() {
    localStorage.removeItem('sd-admin-token');
    localStorage.removeItem('sd-admin-refresh');
}

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

    if (response.status === 401) {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('sd-admin-refresh') : null;

        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    localStorage.setItem('sd-admin-token', refreshData.accessToken);
                    localStorage.setItem('sd-admin-refresh', refreshData.refreshToken);

                    // Retry the original request with the new token
                    const retryHeaders = { ...headers, Authorization: `Bearer ${refreshData.accessToken}` };
                    const retry = await fetch(url, { ...options, headers: retryHeaders });
                    const retryData = await retry.json();
                    if (!retry.ok) throw new Error(retryData.error || 'Request failed');
                    return retryData;
                } else {
                    // Refresh token expired — clear and fall through to show login
                    clearAdminSession();
                    return;
                }
            } catch (err) {
                clearAdminSession();
                return;
            }
        } else {
            clearAdminSession();
            return;
        }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const adminApi = {
    get:    (endpoint)       => adminRequest(endpoint),
    post:   (endpoint, body) => adminRequest(endpoint, { method: 'POST',  body: JSON.stringify(body) }),
    patch:  (endpoint, body) => adminRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint)       => adminRequest(endpoint, { method: 'DELETE' }),
};
