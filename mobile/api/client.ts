const API_BASE_URL = 'https://salesforce-metadata-manager.replit.app';

/**
 * Function to make API requests to our backend
 */
async function apiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  options: RequestInit = {}
) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include', // Send cookies for session authentication
    ...options,
  };

  if (data) {
    requestOptions.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    
    // If the response is not ok (status outside of 200-299)
    if (!response.ok) {
      // Try to parse the error message from the response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      } catch (parseError) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // For 204 No Content, don't attempt to parse JSON
    if (response.status === 204) {
      return null;
    }
    
    // Otherwise, parse the JSON response
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Authentication API
export const authApi = {
  login: (username: string, password: string) => 
    apiRequest('POST', '/api/login', { username, password }),
  
  register: (username: string, password: string) => 
    apiRequest('POST', '/api/register', { username, password }),
  
  logout: () => 
    apiRequest('POST', '/api/logout'),
  
  getCurrentUser: () => 
    apiRequest('GET', '/api/user'),
};

// Salesforce Orgs API
export const orgApi = {
  getOrgs: () => 
    apiRequest('GET', '/api/orgs'),
  
  connectOrg: (orgData: {
    name: string;
    instanceUrl: string;
    accessToken: string;
  }) => 
    apiRequest('POST', '/api/orgs', orgData),
  
  disconnectOrg: (orgId: number) => 
    apiRequest('DELETE', `/api/orgs/${orgId}`),
};

// Metadata API
export const metadataApi = {
  getOrgMetadata: (orgId: number, type?: string) => 
    apiRequest('GET', `/api/orgs/${orgId}/metadata${type ? `?type=${type}` : ''}`),
};

// Health Score API
export const healthScoreApi = {
  getHealthScore: (orgId: number) => 
    apiRequest('GET', `/api/orgs/${orgId}/health-score`),
};

// SOQL Query API
export const queryApi = {
  executeQuery: (orgId: number, query: string) => 
    apiRequest('POST', `/api/orgs/${orgId}/query`, { query }),
};

export default {
  auth: authApi,
  orgs: orgApi,
  metadata: metadataApi,
  healthScore: healthScoreApi,
  query: queryApi,
};