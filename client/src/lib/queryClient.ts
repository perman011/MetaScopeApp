import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: RequestInit,
): Promise<Response>;

export async function apiRequest(
  url: string,
  options?: RequestInit,
): Promise<any>;

export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions?: string | RequestInit,
  data?: unknown | undefined,
  options?: RequestInit,
): Promise<any> {
  let method: string;
  let url: string;
  let requestOptions: RequestInit = {};
  
  // Handle overloaded function signatures
  if (typeof urlOrOptions === 'string') {
    // First signature: (method, url, data?, options?)
    method = methodOrUrl;
    url = urlOrOptions;
    requestOptions = {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      ...options,
    };
  } else {
    // Second signature: (url, options?)
    method = 'GET';
    url = methodOrUrl;
    requestOptions = {
      method,
      credentials: "include",
      ...urlOrOptions,
    };
  }

  const res = await fetch(url, requestOptions);
  await throwIfResNotOk(res);
  
  // For GET requests, return the parsed JSON
  if (method === 'GET') {
    return await res.json();
  }
  
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
