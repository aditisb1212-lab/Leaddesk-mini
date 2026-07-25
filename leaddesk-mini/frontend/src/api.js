const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // send/receive the httpOnly auth cookie
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // some responses (e.g. 204 on logout) have no body
  }

  if (!res.ok) {
    const message = data?.errors?.[0]?.msg || data?.error || "Something went wrong";
    throw new Error(message);
  }

  return data;
}

export const api = {
  submitLead: (payload) =>
    request("/leads", { method: "POST", body: JSON.stringify(payload) }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  logout: () => request("/auth/logout", { method: "POST" }),

  me: () => request("/auth/me"),

  listLeads: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/leads${qs ? `?${qs}` : ""}`);
  },

  updateStatus: (id, status) =>
    request(`/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
