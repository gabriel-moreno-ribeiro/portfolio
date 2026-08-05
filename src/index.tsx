import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.scss";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(<App />);

const scheduleIdle = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 2000));
scheduleIdle(() => {
  import("posthog-js").then(({ default: posthog }) => {
    posthog.init("phc_cgNNpL9lqLK50jeJICAV6xcGZDmuDnuPVxPeG8Ieg6m", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: { maskAllInputs: false },
    });
  });
});
