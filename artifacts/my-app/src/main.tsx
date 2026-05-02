import React from "react";
import { createRoot } from "react-dom/client";
import { Router, Route, Switch } from "wouter";
import App from "./App.jsx";
import PrivacyPage from "./PrivacyPage.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

window.onerror = function(msg, src, line, col, err) {
  console.error("[ExclusiveDetroit] Uncaught error:", msg, src, line, col, err);
};
window.addEventListener("unhandledrejection", function(e) {
  console.error("[ExclusiveDetroit] Unhandled promise rejection:", e.reason);
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ExclusiveDetroit] React error boundary caught:", error, info);
  }
  render() {
    if (this.state.crashed) {
      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#0A0A0A",
            color: "#F5F2EE",
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: "24px",
          },
        },
        React.createElement("div", { style: { fontSize: "2rem", marginBottom: "16px" } }, "✦"),
        React.createElement("p", { style: { fontSize: "1rem", lineHeight: 1.6 } }, "Something went wrong. Please restart the app.")
      );
    }
    return this.props.children;
  }
}

try {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root element not found");

  createRoot(rootEl).render(
    React.createElement(
      ErrorBoundary,
      null,
      React.createElement(
        Router,
        null,
        React.createElement(
          Switch,
          null,
          React.createElement(Route, { path: "/privacy", component: PrivacyPage }),
          React.createElement(Route, { component: App })
        )
      )
    )
  );
} catch (e) {
  console.error("[ExclusiveDetroit] Failed to mount app:", e);
  const rootEl = document.getElementById("root");
  if (rootEl) {
    rootEl.innerHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0A0A0A;color:#F5F2EE;font-family:sans-serif;text-align:center;padding:24px"><div style="font-size:2rem;margin-bottom:16px">✦</div><p style="font-size:1rem;line-height:1.6">Something went wrong. Please restart the app.</p></div>';
  }
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) reg.unregister();
  });
}
