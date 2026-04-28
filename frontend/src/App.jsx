/**
 * App — Root component with routing and layout.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import Onboarding from './pages/onboarding';
import Dashboard from './pages/Dashboard';
import ControlTower from './pages/ControlTower';
import Shipments from './pages/Shipments';
import Alerts from './pages/Alerts';
import Suppliers from './pages/Suppliers';
import ActionLog from './pages/ActionLog';
import Simulation from './pages/Simulation';
import Learning from './pages/Learning';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar />
        <main className="flex-1 ml-[240px] p-6 pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/control-tower" element={<ControlTower />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/actions" element={<ActionLog />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/learning" element={<Learning />} />
          </Routes>
        </main>
        <ChatPanel />
      </div>
    </BrowserRouter>
  );
}
