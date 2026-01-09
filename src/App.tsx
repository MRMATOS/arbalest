import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { PlusCircle, Calendar, Filter, History, Send } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './modules/Login';
import { Register } from './modules/Register';
import { WaitingApproval } from './modules/WaitingApproval';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ValidityList } from './modules/validity/ValidityList';
import { ValidityHistoryPage } from './modules/validity/ValidityHistoryPage';
import { AddValidityModal } from './modules/validity/AddValidityModal';
import { AdminDashboard } from './modules/admin/AdminDashboard';
import { Profile } from './modules/profile/Profile';
import { ModuleHub } from './modules/ModuleHub';
import { PlanogramDashboard } from './modules/planogram/PlanogramDashboard';
import { SettingsDashboard } from './modules/settings/SettingsDashboard';
import { ModulePatternsPage } from './modules/planogram/ModulePatternsPage';
import { StoresList } from './modules/settings/components/StoresList';
import { ButcherDashboard } from './modules/butcher/ButcherDashboard';
import { ButcherHistory } from './modules/butcher/ButcherHistory';

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

// Previous CreateDashboard/ValidityPage
function ValidityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSolicitationModalOpen, setIsSolicitationModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const isConferente = user?.role?.toLowerCase() === 'conferente';
  const isManager = user?.role === 'encarregado' || user?.role === 'admin';

  const filterAction = (
    <button
      onClick={() => setIsFilterModalOpen(true)}
      className="nav-btn"
    >
      <Filter size={24} />
      <span>Filtrar</span>
    </button>
  );

  const validityAction = (
    <Link
      to="/validity"
      className="nav-btn active"
    >
      <Calendar size={24} />
      <span>Validade</span>
    </Link>
  );

  const historyAction = (
    <Link to="/validity/history" className="nav-btn">
      <History size={24} />
      <span>Histórico</span>
    </Link>
  );

  const solicitAction = (
    <button
      onClick={() => setIsSolicitationModalOpen(true)}
      className="nav-btn"
    >
      <Send size={24} color="var(--warning)" />
      <span>Solicitar</span>
    </button>
  );

  const registerAction = (
    <button
      onClick={() => setIsModalOpen(true)}
      className="nav-btn"
    >
      <PlusCircle size={24} color="var(--brand-primary)" />
      <span>Registrar</span>
    </button>
  );

  const handleOpenAdd = () => setIsModalOpen(true);

  return (
    <>
      <DashboardLayout
        onAddClick={!isConferente && !isManager ? handleOpenAdd : undefined}
        // User requested: Menu, History, Filter, Validity, Solicit/Register
        hideDefaultModuleNav={isConferente || isManager}
        filterMobileAction={(isConferente || isManager) ? historyAction : filterAction}
        secondaryMobileAction={(isConferente || isManager) ? filterAction : undefined}
        tertiaryMobileAction={(isConferente || isManager) ? validityAction : undefined}
        customMobileAction={isConferente ? solicitAction : (isManager ? registerAction : undefined)}
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
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </>
  );
}

function ValidityHistoryRoute() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();

  // Custom Actions for History Page
  // Slot 2: Histórico (Active)
  const historyAction = (
    <Link to="/validity/history" className="nav-btn active">
      <History size={24} />
      <span>Histórico</span>
    </Link>
  );

  // Slot 3: Filtro
  const filterAction = (
    <button
      onClick={() => setIsFilterModalOpen(true)}
      className="nav-btn"
    >
      <Filter size={24} />
      <span>Filtro</span>
    </button>
  );

  // Slot 4: Validade
  const validityAction = (
    <Link to="/validity" className="nav-btn">
      <Calendar size={24} />
      <span>Validade</span>
    </Link>
  );

  // Slot 5: Solicitar / Registrar
  const isManager = user?.role === 'admin' || user?.role === 'encarregado';
  const addLabel = isManager ? 'Registrar' : 'Solicitar';

  const addActionWithLabel = (
    <button
      className="nav-btn"
      onClick={() => setIsAddModalOpen(true)}
      style={{ color: isManager ? 'var(--brand-primary)' : 'var(--warning)' }}
    >
      {isManager ? <PlusCircle size={24} /> : <Send size={24} />}
      <span>{addLabel}</span>
    </button>
  );

  return (
    <>
      <DashboardLayout
        hideDefaultModuleNav={true}
        filterMobileAction={historyAction} // Slot 2
        secondaryMobileAction={filterAction} // Slot 3
        tertiaryMobileAction={validityAction} // Slot 4
        customMobileAction={addActionWithLabel} // Slot 5
      >
        <ValidityHistoryPage
          isFilterModalOpen={isFilterModalOpen}
          onCloseFilterModal={() => setIsFilterModalOpen(false)}
        />
      </DashboardLayout>

      <AddValidityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => setIsAddModalOpen(false)}
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
            <Route path="/profile" element={<Profile />} />

            {/* Approved Routes */}
            <Route element={<RequireApproval />}>
              <Route path="/" element={<ModuleHub />} />
              <Route path="/hub" element={<Navigate to="/" replace />} />

              <Route path="/validity" element={<ValidityPage />} />
              <Route path="/validity/history" element={<ValidityHistoryRoute />} />
              <Route path="/planogram" element={<PlanogramDashboard />} />
              <Route path="/planogram/patterns" element={<ModulePatternsPage />} />

              <Route path="/butcher" element={<ButcherDashboard />} />
              <Route path="/butcher/history" element={<ButcherHistory />} />

              {/* Admin Routes */}
              <Route element={<RequireAdmin />}>
                <Route path="/settings" element={<SettingsDashboard />} />
                <Route path="/settings/users" element={<AdminDashboard />} />
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
