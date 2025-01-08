import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { WagmiConfig } from "wagmi";
import { config } from "./config/wagmi";
import App from "./App";
import "./index.less";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <HashRouter>
        <App />
      </HashRouter>
    </WagmiConfig>
  </React.StrictMode>
);
