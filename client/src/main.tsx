import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./hooks/use-auth";
import { OrgProvider } from "./hooks/use-org";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <OrgProvider>
      <App />
    </OrgProvider>
  </AuthProvider>
);
