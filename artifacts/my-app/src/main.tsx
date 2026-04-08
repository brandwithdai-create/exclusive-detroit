import { createRoot } from "react-dom/client";
import { Router, Route, Switch } from "wouter";
import App from "./App.jsx";
import PrivacyPage from "./PrivacyPage.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")!).render(
  <Router>
    <Switch>
      <Route path="/privacy" component={PrivacyPage} />
      <Route component={App} />
    </Switch>
  </Router>
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const reg of registrations) reg.unregister();
  });
}
