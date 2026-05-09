import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerView from './pages/CustomerView';
import CashierView from './pages/CashierView';
import KitchenView from './pages/KitchenView';
import OwnerView from './pages/OwnerView';
import LandingPage from './pages/LandingPage';
import DiagnosticView from './pages/DiagnosticView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/table/:tableId" element={<CustomerView />} />
        <Route path="/cashier" element={<CashierView />} />
        <Route path="/kitchen" element={<KitchenView />} />
        <Route path="/owner" element={<OwnerView />} />
        <Route path="/debug" element={<DiagnosticView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
