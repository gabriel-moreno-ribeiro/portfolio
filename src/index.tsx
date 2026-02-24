import posthog from "posthog-js";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.scss";

posthog.init("phc_cgNNpL9lqLK50jeJICAV6xcGZDmuDnuPVxPeG8Ieg6m", {
  api_host: "https://us.i.posthog.com",
  person_profiles: "identified_only",
  capture_pageview: true,
  capture_pageleave: true,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);
