import "vite/modulepreload-polyfill";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import { theme } from "./theme";

const pages = import.meta.glob("./pages/**/*.jsx", { eager: true });

function getInitialPage() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const appElement = document.getElementById("app");
  const legacyPage = appElement?.dataset.page;

  if (!legacyPage) {
    return undefined;
  }

  try {
    // inertia-django still renders the legacy data-page payload.
    return JSON.parse(legacyPage);
  } catch (error) {
    console.error("Failed to parse the initial Inertia page payload.", error);
    return undefined;
  }
}

createInertiaApp({
  page: getInitialPage(),
  title: (title) => (title ? `${title} | Pulseboard` : "Pulseboard"),
  resolve: (name) => {
    const page = pages[`./pages/${name}.jsx`];

    if (!page) {
      throw new Error(`Unknown Inertia page: ${name}`);
    }

    return page;
  },
  progress: {
    color: "#0f766e",
    delay: 120,
  },
  http: {
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App {...props} />
        </ThemeProvider>
      </StrictMode>,
    );
  },
});
