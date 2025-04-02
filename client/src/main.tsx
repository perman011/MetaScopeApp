import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Create a global toast service
const createGlobalToastService = () => {
  const defaultToastHandler = (props: any) => { 
    console.log(`Toast: ${props.title || 'Notification'} - ${props.description || ''}`);
    return { id: 'global-fallback', dismiss: () => {} };
  };

  if (typeof window !== 'undefined') {
    // Using this technique to avoid TypeScript errors
    (window as any).__TOAST_SERVICE = { 
      notify: defaultToastHandler,
      toast: defaultToastHandler,
      isHeadless: false
    };
  }
};

// Initialize global toast service
createGlobalToastService();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>
);
