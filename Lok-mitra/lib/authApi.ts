const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.160.46:5000';
let authToken: string | null = null;

type SignupPayload = {
  name: string;
  email: string;
  password: string;
  confirmPass: string;
  empID: string;
  role: 'CITIZEN';
};

type VerifyOtpPayload = {
  email: string;
  otp: string;
  role: 'CITIZEN';
};

type LoginPayload = {
  email: string;
  password: string;
  role: 'CITIZEN';
};

type ComplaintFile = {
  uri: string;
  name: string;
  type: string;
};

type ComplaintPayload = {
  title: string;
  description: string;
  files: ComplaintFile[];
};

type ComplaintLog = {
  message?: string;
  action?: string;
  createdAt?: string;
};

export type CitizenComplaint = {
  _id: string;
  complaintId: string;
  title: string;
  description: string;
  status: 'Pending' | 'Under Review' | 'Routed' | 'Resolved';
  assignedDepartment?: string | null;
  issueId?: string | null;
  createdAt: string;
  updatedAt: string;
  logs?: ComplaintLog[];
  media?: Array<{ type: 'image' | 'video'; url: string }>;
};

async function request(path: string, body: object) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? 'Request failed');
  }

  return data;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export async function signupCitizen(payload: SignupPayload) {
  return request('/citizen/signup', payload);
}

export async function verifyCitizenOtp(payload: VerifyOtpPayload) {
  return request('/citizen/verify-otp', payload);
}

export async function loginCitizen(payload: LoginPayload) {
  return request('/citizen/login', payload);
}

export async function createCitizenComplaint(payload: ComplaintPayload) {
  if (!authToken) {
    throw new Error('You are not logged in. Please login again.');
  }

  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('description', payload.description);

  for (const file of payload.files) {
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
  }

  const response = await fetch(`${API_BASE_URL}/citizen/complaints`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? 'Failed to create complaint');
  }

  return data;
}

export async function getMyCitizenComplaints(): Promise<{ complaints: CitizenComplaint[] }> {
  if (!authToken) {
    throw new Error('You are not logged in. Please login again.');
  }

  const response = await fetch(`${API_BASE_URL}/citizen/complaints`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? 'Failed to fetch complaints');
  }

  return {
    complaints: Array.isArray(data?.complaints) ? data.complaints : [],
  };
}
