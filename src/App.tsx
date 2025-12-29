import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Send } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './modules/Login';
import { Register } from './modules/Register';
import { WaitingApproval } from './modules/WaitingApproval';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ValidityList } from './modules/validity/ValidityList';
import { AddValidityModal } from './modules/validity/AddValidityModal';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { Profile } from './modules/profile/Profile';
// Guard: Requires valid session only
const RequireAuth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Guard: Requires approved profile
const RequireApproval = () => {
  const { user } = useAuth();

  if (!user?.approved_at && user?.role !== 'admin') {
    return <Navigate to="/aguardando-aprovacao" replace />;
  }

  return <Outlet />;
};

// Guard: Requires Admin Role
const RequireAdmin = () => {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Rename CreateDashboard to ValidityPage for clarity
function ValidityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSolicitationModalOpen, setIsSolicitationModalOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const isConferente = user?.role === 'conferente';

  // Custom action for Conferente (Yellow Send Button)
  const customMobileAction = isConferente ? (
    <button
      onClick={() => setIsSolicitationModalOpen(true)}
      style={{
        background: 'none',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        gap: '4px',
        color: 'var(--text-secondary)',
        fontSize: '0.65rem',
        padding: 0
      }}
    >
      <Send size={24} color="var(--warning)" />
      <span style={{ fontWeight: 500 }}>Solicitar</span>
    </button>
  ) : undefined;

  const handleOpenAdd = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <DashboardLayout
        onAddClick={!isConferente || user?.role === 'admin' ? handleOpenAdd : undefined}
        customMobileAction={customMobileAction}
      >
        <ValidityList
          key={refreshTrigger}
          onAddClick={handleOpenAdd}
          isSolicitationModalOpen={isSolicitationModalOpen}
          onCloseSolicitationModal={() => setIsSolicitationModalOpen(false)}
          onOpenSolicitationModal={() => setIsSolicitationModalOpen(true)}

        />
      </DashboardLayout>

      <AddValidityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/aguardando-aprovacao" element={<WaitingApproval />} />
            <Route path="/profile" element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            } />

            {/* Approved Routes */}
            <Route element={<RequireApproval />}>
              <Route path="/" element={<Navigate to="/validity" replace />} />

              <Route path="/validity" element={<ValidityPage />} />

              {/* Admin Routes */}
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                } />
              </Route>
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
