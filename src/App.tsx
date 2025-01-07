import { Routes, Route } from "react-router-dom";
import AIAgent from "./pages/AIAgent";
import AgentList from "./pages/AgentList";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<AgentList />} />
        <Route path="/ai" element={<AIAgent />} />
        <Route path="*" element={<AgentList />} />
      </Routes>
    </div>
  );
}

export default App;
