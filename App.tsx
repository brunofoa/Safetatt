
import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Screen, User, Studio, Role } from './types';
import ClientSelfRegistration from './views/public/ClientSelfRegistration';
import UpdatePassword from './views/UpdatePassword';
import Login from './views/Login';
import StudioSelection from './views/StudioSelection';
import Dashboard from './views/Dashboard';
import Clients from './views/Clients';
import Appointments from './views/Appointments';
import Settings from './views/Settings';
import NewAppointment from './views/NewAppointment';
import ClientProfile from './views/ClientProfile';
import AppointmentDetailsModal from './components/AppointmentDetailsModal';
import Agenda from './views/Agenda';
import Marketing from './views/Marketing';
import Loyalty from './views/Loyalty';
import Layout from './components/Layout';
import ClientLayout from './components/ClientLayout';
import ClientHome from './views/client/ClientHome';
import ClientCare from './views/client/ClientCare';
import ClientHistory from './views/client/ClientHistory';
import ClientFinancial from './views/client/ClientFinancial';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminStudios from './views/admin/AdminStudios';
import NewStudioForm from './views/admin/NewStudioForm';

// Temporary adapter to match local User type with Supabase User
const ADAPTER_USER: User = {
  id: 'user_1',
  name: 'Bruno Foa',
  email: 'bruno@safetatt.com',
  role: 'Master',
  avatar: 'https://picsum.photos/seed/bruno/100/100'
};

const AppContent: React.FC = () => {
  const { user: authUser, loading, sessionRole, currentStudio, selectSession } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.STUDIO_SELECTION);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientTab, setSelectedClientTab] = useState<string>('dados');

  // Sync auth state with screen
  useEffect(() => {
    if (!authUser && !loading) {
      // Automatically handled by conditional rendering below
    }
  }, [authUser, loading]);

  const handleSelectStudio = useCallback((studio: Studio) => {
    selectSession(studio, studio.role);
    // Redirect based on role
    if (studio.role === 'CLIENT') {
      setCurrentScreen(Screen.CLIENT_HOME);
    } else {
      setCurrentScreen(Screen.DASHBOARD);
    }
  }, [selectSession]);

  const navigate = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleEditClient = useCallback((clientId: string, tab: string = 'dados') => {
    setSelectedClientId(clientId);
    setSelectedClientTab(tab);
    setCurrentScreen(Screen.CLIENT_PROFILE);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authUser) {
    return <Login onLogin={() => { }} />;
  }

  // Adapter for "User" prop required by existing views
  const appUser: User = {
    ...ADAPTER_USER,
    id: authUser.id,
    email: authUser.email || ADAPTER_USER.email,
    role: sessionRole || 'Master' // Fallback for display
  };

  // Check if we are in an Admin Screen
  const isAdminScreen = currentScreen === Screen.ADMIN_DASHBOARD || currentScreen === Screen.ADMIN_STUDIOS || currentScreen === Screen.ADMIN_NEW_STUDIO;

  // If no session is selected, show Studio Selection (The Lobby)
  // BUT allow bypass if we are trying to go to Admin Screens
  if ((!sessionRole || !currentStudio) && !isAdminScreen) {
    return (
      <StudioSelection
        user={appUser}
        onSelectStudio={handleSelectStudio}
        onEnterAdmin={() => setCurrentScreen(Screen.ADMIN_DASHBOARD)}
      />
    );
  }

  // Render Client Layout
  if (sessionRole === 'CLIENT') {
    // ... (existing client render)
    const renderClientScreen = () => {
      switch (currentScreen) {
        case Screen.CLIENT_HOME:
          return <ClientHome onNavigate={navigate} />;
        case Screen.CLIENT_HISTORY:
          return <ClientHistory />;
        case Screen.CLIENT_CARE:
          return <ClientCare />;
        case Screen.CLIENT_FINANCIAL:
          return <ClientFinancial />;
        default:
          return <ClientHome onNavigate={navigate} />;
      }
    };

    return (
      <ClientLayout currentScreen={currentScreen} onNavigate={navigate}>
        {renderClientScreen()}
      </ClientLayout>
    );
  }

  // Render Admin Layout
  if (currentScreen === Screen.ADMIN_DASHBOARD || currentScreen === Screen.ADMIN_STUDIOS || currentScreen === Screen.ADMIN_NEW_STUDIO) {
    const renderAdminScreen = () => {
      switch (currentScreen) {
        case Screen.ADMIN_DASHBOARD:
          return <AdminDashboard />;
        case Screen.ADMIN_STUDIOS:
          return <AdminStudios onNewStudio={() => navigate(Screen.ADMIN_NEW_STUDIO)} />;
        case Screen.ADMIN_NEW_STUDIO:
          return <NewStudioForm onCancel={() => navigate(Screen.ADMIN_STUDIOS)} onSuccess={() => navigate(Screen.ADMIN_STUDIOS)} />;
        default:
          return <AdminDashboard />;
      }
    };

    return (
      <AdminLayout currentScreen={currentScreen} onNavigate={navigate}>
        {renderAdminScreen()}
      </AdminLayout>
    );
  }

  // Render Master/Artist Layout (Dashboard)
  const renderDashboardScreen = () => {
    switch (currentScreen) {
      case Screen.DASHBOARD:
        return <Dashboard user={appUser} />;
      case Screen.CLIENTS:
        return <Clients onEditClient={handleEditClient} />;
      case Screen.APPOINTMENTS:
        return <Appointments onNewAppointment={() => navigate(Screen.NEW_APPOINTMENT)} />;
      case Screen.SETTINGS:
        return <Settings />;
      case Screen.NEW_APPOINTMENT:
        return <NewAppointment onFinish={() => navigate(Screen.APPOINTMENTS)} onCancel={() => navigate(Screen.APPOINTMENTS)} />;
      case Screen.CLIENT_PROFILE:
        return <ClientProfile clientId={selectedClientId!} initialTab={selectedClientTab} onBack={() => navigate(Screen.CLIENTS)} />;
      case Screen.AGENDA:
        return <Agenda onNewAppointment={() => navigate(Screen.NEW_APPOINTMENT)} />;
      case Screen.MARKETING:
        return <Marketing />;
      case Screen.LOYALTY:
        return <Loyalty onViewClientProfile={(id) => handleEditClient(id, 'fidelidade')} />;
      default:
        return <Dashboard user={appUser} />;
    }
  };

  return (
    <Layout user={appUser} currentScreen={currentScreen} onNavigate={navigate}>
      {renderDashboardScreen()}
    </Layout>
  );
};



const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/cadastro/:slug" element={<ClientSelfRegistration />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
