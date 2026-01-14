import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { PlusCircle, Calendar, Filter, History } from 'lucide-react';
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
import { ValidityPermissions } from './utils/permissions';
import { ButcherHistory } from './modules/butcher/ButcherHistory';
import { RequirePermissions, RequireModuleAccess } from './components/RouteGuards';

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const canRegister = ValidityPermissions.canEdit(user);

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

  const registerAction = (
    <button
      onClick={() => setIsModalOpen(true)}
      className="nav-btn"
    >
      <PlusCircle size={24} color="var(--warning)" />
      <span>Registrar</span>
    </button>
  );

  const handleOpenAdd = () => setIsModalOpen(true);

  return (
    <>
      <DashboardLayout
        // Slots Order: Menu (1), History (2), Filter (3), Module (4), Action (5)
        mobileHistory={historyAction} // 2
        mobileFilter={filterAction} // 3
        mobileModule={validityAction} // 4
        mobileAction={canRegister ? registerAction : undefined} // 5
      >
        <ValidityList
          key={refreshTrigger}
          onAddClick={handleOpenAdd}
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
      <span>Filtrar</span>
    </button>
  );

  // Slot 4: Validade
  const validityAction = (
    <Link to="/validity" className="nav-btn">
      <Calendar size={24} />
      <span>Validade</span>
    </Link>
  );

  // Slot 5: Registrar (Manager Only)
  const canRegister = ValidityPermissions.canEdit(user);

  const registerAction = (
    <button
      className="nav-btn"
      onClick={() => setIsAddModalOpen(true)}
      style={{ color: 'var(--warning)' }}
    >
      <PlusCircle size={24} />
      <span>Registrar</span>
    </button>
  );

  return (
    <>
      <DashboardLayout
        // Slots Order: Menu (1), History (2), Filter (3), Module (4), Action (5)
        mobileHistory={historyAction}
        mobileFilter={filterAction}
        mobileModule={validityAction}
        mobileAction={canRegister ? registerAction : undefined}
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
              {/* Strict Permission Guard: Requires Role & Store */}
              <Route element={<RequirePermissions />}>
                <Route path="/" element={<ModuleHub />} />
                <Route path="/hub" element={<Navigate to="/" replace />} />

                {/* Module Specific Guards */}
                <Route element={<RequireModuleAccess module="validity" />}>
                  <Route path="/validity" element={<ValidityPage />} />
                  <Route path="/validity/history" element={<ValidityHistoryRoute />} />
                </Route>

                <Route element={<RequireModuleAccess module="planogram" />}>
                  <Route path="/planogram" element={<PlanogramDashboard />} />
                  <Route path="/planogram/patterns" element={<ModulePatternsPage />} />
                </Route>

                <Route element={<RequireModuleAccess module="butcher" />}>
                  <Route path="/butcher" element={<ButcherDashboard />} />
                  <Route path="/butcher/history" element={<ButcherHistory />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<RequireAdmin />}>
                  <Route path="/settings" element={<SettingsDashboard />} />
                  <Route path="/settings/users" element={<AdminDashboard />} />
                  <Route path="/settings/stores" element={<StoresList />} />
                </Route>
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
