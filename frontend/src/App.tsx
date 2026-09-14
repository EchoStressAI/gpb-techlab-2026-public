import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { TokenPage } from './features/TokenPage';
import { CallsPage } from './features/calls/CallsPage';
import { AuditPage } from './features/audit/AuditPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<TokenPage />} />
          <Route path="/" element={<RequireAuth><CallsPage /></RequireAuth>} />
          <Route path="/audit" element={<RequireAuth><AuditPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
