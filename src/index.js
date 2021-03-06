import React from "react";
import ReactDOM from "react-dom";
import { ChainId, DAppProvider } from "@usedapp/core";
import { HashRouter } from "react-router-dom";
import "antd/dist/antd.css";

import App from "./app";
import reportWebVitals from "./reportWebVitals";

const config = {
  readOnlyChainId: ChainId.Kovan,
  readOnlyUrls: {
    [ChainId.Kovan]:
      "https://eth-kovan.alchemyapi.io/v2/Fxxk6XaqL9Dir7WBqNDL-X8sLq3IzDAw",
  },
};

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <HashRouter>
        <App />
      </HashRouter>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
