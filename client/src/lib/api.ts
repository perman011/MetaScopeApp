/**
 * API utility functions
 */

// API request helper
export async function apiRequest(url: string, options?: RequestInit) {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session management
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options?.headers || {}),
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    return response;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

// Utility to handle response data and errors
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'An unknown error occurred',
    }));
    
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  
  return await response.json();
}

// Typed GET request
export async function fetchData<T>(url: string): Promise<T> {
  const response = await apiRequest(url);
  return handleApiResponse<T>(response);
}

// Typed POST request
export async function postData<T>(url: string, data: any): Promise<T> {
  const response = await apiRequest(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return handleApiResponse<T>(response);
}

// Typed PUT request
export async function putData<T>(url: string, data: any): Promise<T> {
  const response = await apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return handleApiResponse<T>(response);
}

// Typed DELETE request
export async function deleteData<T>(url: string): Promise<T> {
  const response = await apiRequest(url, {
    method: 'DELETE',
  });
  return handleApiResponse<T>(response);
}