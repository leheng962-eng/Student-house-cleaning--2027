// Small helper for talking to the backend. Use it in app.js instead of localStorage.
const API = '/api';
async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(API + path, {
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
               ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
// Example: const students = await api('/students');
//          await api('/students', { method: 'POST', body: { fullName: 'Sok' } });
