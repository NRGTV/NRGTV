import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAdBlock } from "./lib/adblock";
import useGamepad from "./hooks/useGamepad";
import useTVRemote from "./hooks/useTVRemote";

// Boot ad blocker BEFORE React renders (important for fetch/XHR patching)
initAdBlock();

function InputInitWrapper({ children }: { children: React.ReactNode }) {
  // initialize global input hooks once
  useGamepad();
  useTVRemote();
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <InputInitWrapper>
      <App />
    </InputInitWrapper>
  </React.StrictMode>
);
