import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './modules/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ValidityList } from './modules/validity/ValidityList';
import { AddValidityModal } from './modules/validity/AddValidityModal';
import './styles/global.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <DashboardLayout onAddClick={() => setIsModalOpen(true)}>
        <ValidityList key={refreshTrigger} />
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
