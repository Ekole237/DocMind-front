import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/components/theme-provider.tsx"
import "@workspace/ui/globals.css"
import { App } from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
