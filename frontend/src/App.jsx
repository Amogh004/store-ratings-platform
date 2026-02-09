import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import UserStoresPage from './pages/UserStoresPage.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import { useAuth, AuthProvider } from './authContext.jsx';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo">Store Ratings Platform</span>
        </div>
        <div className="app-header-right">
          {user ? (
            <>
              <span className="user-info">
                {user.name} ({user.role})
              </span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const homeElement = user ? (
    user.role === 'ADMIN' ? (
      <AdminDashboard />
    ) : user.role === 'STORE_OWNER' ? (
      <OwnerDashboard />
    ) : (
      <UserStoresPage />
    )
  ) : (
    <Navigate to="/login" replace />
  );

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/stores"
          element={
            <PrivateRoute roles={['USER']}>
              <UserStoresPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <PrivateRoute roles={['STORE_OWNER']}>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={homeElement} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

