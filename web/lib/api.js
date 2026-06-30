const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function clearSellerSession() {
    localStorage.removeItem('sd-token');
    localStorage.removeItem('sd-refresh-token');
    localStorage.removeItem('sd-seller');
}

function redirectToLogin() {
    if (typeof window !== 'undefined') {
        window.location.href = '/seller/login';
    }
}

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

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('sd-refresh-token') : null;

        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    localStorage.setItem('sd-token', refreshData.accessToken);
                    localStorage.setItem('sd-refresh-token', refreshData.refreshToken);

                    // Retry the original request with the new token
                    const retryHeaders = { ...headers, Authorization: `Bearer ${refreshData.accessToken}` };
                    const retry = await fetch(url, { ...options, headers: retryHeaders });
                    const retryData = await retry.json();
                    if (!retry.ok) throw new Error(retryData.error || 'Request failed');
                    return retryData;
                } else {
                    // Refresh token itself is expired — session is fully dead
                    clearSellerSession();
                    redirectToLogin();
                    return; // Stop execution
                }
            } catch (err) {
                // Network error or retry threw — clear session and redirect
                clearSellerSession();
                redirectToLogin();
                return;
            }
        } else {
            // No refresh token at all — clear and redirect
            clearSellerSession();
            redirectToLogin();
            return;
        }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const api = {
    get:    (endpoint)       => request(endpoint),
    post:   (endpoint, body) => request(endpoint, { method: 'POST',  body: JSON.stringify(body) }),
    patch:  (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};
