const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function toUpperRole(role) {
  return String(role || '').trim().toUpperCase();
}

function toLowerRole(role) {
  return String(role || '').trim().toLowerCase();
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  baseUrl: API_BASE_URL,

  login({ email, password, role }) {
    const roleUpper = toUpperRole(role);
    const roleLower = toLowerRole(role);
    return request(`/auth/${roleLower}/login`, {
      method: 'POST',
      body: { email, password, role: roleUpper },
    });
  },

  signup({ name, email, password, confirmPass, empID, role }) {
    const roleUpper = toUpperRole(role);
    const roleLower = toLowerRole(role);
    return request(`/auth/${roleLower}/signup`, {
      method: 'POST',
      body: { name, email, password, confirmPass, empID, role: roleUpper },
    });
  },

  verifySignupOtp({ email, otp, role }) {
    const roleUpper = toUpperRole(role);
    const roleLower = toLowerRole(role);
    return request(`/auth/${roleLower}/verify-otp`, {
      method: 'POST',
      body: { email, otp, role: roleUpper },
    });
  },

  getDashboard({ token, role }) {
    const roleUpper = toUpperRole(role);
    const suffix = roleUpper === 'ADMIN' ? 'admin' : toLowerRole(roleUpper);
    return request(`/dashboard/${suffix}`, { token });
  },

  getHazards(token) {
    return request('/admin/hazards', { token });
  },

  createHazard(token, payload) {
    return request('/admin/hazards', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  importCloudinaryHazard(token, payload) {
    return request('/admin/import-cloudinary-hazard', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  routeHazard(token, hazardId, departments) {
    return request('/admin/route-hazard', {
      method: 'POST',
      token,
      body: departments ? { hazardId, departments } : { hazardId },
    });
  },

  getAllIssues(token) {
    return request('/admin/all-issues', { token });
  },

  getAllComplaints(token) {
    return request('/admin/complaints', { token });
  },

  getPendingComplaints(token) {
    return request('/admin/complaints/pending', { token });
  },

  updateComplaintStatus(token, payload) {
    return request('/admin/complaints/status', {
      method: 'PATCH',
      token,
      body: payload,
    });
  },

  routeComplaint(token, payload) {
    return request('/admin/complaints/route', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  getCloudinaryHazardVideos(token, { folder, maxResults, nextCursor } = {}) {
    const params = new URLSearchParams();

    if (folder) params.set('folder', folder);
    if (maxResults) params.set('maxResults', String(maxResults));
    if (nextCursor) params.set('nextCursor', nextCursor);

    const query = params.toString();
    const path = `/admin/cloudinary-videos${query ? `?${query}` : ''}`;

    return request(path, { token });
  },

  getAssignedIssues(token, role) {
    const roleLower = toLowerRole(role);
    return request(`/${roleLower}/assigned-issues`, { token });
  },

  updateIssueStatus(token, role, payload) {
    const roleLower = toLowerRole(role);
    return request(`/${roleLower}/update-status`, {
      method: 'PATCH',
      token,
      body: payload,
    });
  },

  addIssueUpdate(token, role, payload) {
    const roleLower = toLowerRole(role);
    return request(`/${roleLower}/add-update`, {
      method: 'POST',
      token,
      body: payload,
    });
  },

  resolveIssue(token, role, payload) {
    const roleLower = toLowerRole(role);
    return request(`/${roleLower}/resolve-issue`, {
      method: 'POST',
      token,
      body: payload,
    });
  },
};
