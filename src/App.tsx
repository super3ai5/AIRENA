import { Routes, Route } from "react-router-dom";
import AIAgent from "./pages/AIAgent";
import AgentList from "./pages/AgentList";
import { WagmiConfig, createConfig, configureChains, mainnet } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { ConfigProvider, theme } from "antd";
import { message } from "antd";

message.config({
  maxCount: 1,
  top: 24,
  duration: 3
});

const { publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
});

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#00ffad",
          colorBgContainer: "#141414",
          colorBgElevated: "#1f1f1f",
          colorText: "#ffffff",
          colorTextSecondary: "rgba(255, 255, 255, 0.65)",
          colorBgLayout: "#141414",
          colorBorder: "#303030",
          colorPrimaryBorder: "#00ffad",
          colorPrimaryHover: "#00ffad",
          colorPrimaryActive: "#00cc8a",
        },
        components: {
          Button: {
            defaultBorderColor: "#00ffad",
            defaultColor: "#00ffad",
            colorBorder: "#00ffad",
            defaultHoverBorderColor: "#00ffad",
            defaultHoverColor: "#00ffad",
          },
        },
      }}
    >
      <WagmiConfig config={config}>
        <div>
          <Routes>
            <Route path="/" element={<AgentList />} />
            <Route path="/ai" element={<AIAgent />} />
            <Route path="*" element={<AgentList />} />
          </Routes>
        </div>
      </WagmiConfig>
    </ConfigProvider>
  );
}

export default App;
