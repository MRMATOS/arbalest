import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Send, Filter } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './modules/Login';
import { Register } from './modules/Register';
import { WaitingApproval } from './modules/WaitingApproval';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ValidityList } from './modules/validity/ValidityList';
import { AddValidityModal } from './modules/validity/AddValidityModal';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { Profile } from './modules/profile/Profile';
import { ModuleHub } from './modules/ModuleHub';
import { PlanogramDashboard } from './modules/planogram/PlanogramDashboard';
import { SettingsDashboard } from './modules/settings/SettingsDashboard';
import { ModulePatternsPage } from './modules/planogram/ModulePatternsPage';
import { StoresList } from './modules/settings/components/StoresList';
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
        secondaryMobileAction={user?.role === 'admin' ? (
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
        ) : undefined}
        filterMobileAction={
          <button
            onClick={() => setIsFilterModalOpen(true)}
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
            <Filter size={24} />
            <span style={{ fontWeight: 500 }}>Filtrar</span>
          </button>
        }
      >
        <ValidityList
          key={refreshTrigger}
          onAddClick={handleOpenAdd}
          isSolicitationModalOpen={isSolicitationModalOpen}
          onCloseSolicitationModal={() => setIsSolicitationModalOpen(false)}
          onOpenSolicitationModal={() => setIsSolicitationModalOpen(true)}
          isFilterModalOpen={isFilterModalOpen}
          onCloseFilterModal={() => setIsFilterModalOpen(false)}
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
              <Route path="/" element={<ModuleHub />} />
              <Route path="/hub" element={<Navigate to="/" replace />} />

              <Route path="/validity/*" element={<ValidityPage />} />

              <Route path="/planogram" element={<PlanogramDashboard />} />
              <Route path="/planogram/patterns" element={<ModulePatternsPage />} />

              {/* Admin Routes */}
              <Route element={<RequireAdmin />}>
                <Route path="/settings" element={<SettingsDashboard />} />
                <Route path="/settings/users" element={
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                } />
                <Route path="/settings/stores" element={<StoresList />} />
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
