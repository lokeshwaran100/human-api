import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Preferences from './pages/Preferences';
import Policies from './pages/Policies';
import ConnectedAgents from './pages/ConnectedAgents';
import Activity from './pages/Activity';
import TravelAgentDemo from './pages/TravelAgentDemo';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/agents" element={<ConnectedAgents />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/demo" element={<TravelAgentDemo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
