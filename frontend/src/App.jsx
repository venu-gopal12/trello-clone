import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar'; // Keep for Login/Register if needed, or remove
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import ActivityPage from './pages/ActivityPage';
import OrganizationSettings from './pages/OrganizationSettings';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OrganizationManagement from './pages/admin/OrganizationManagement';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import ProtectedRoute from './components/ProtectedRoute'; // Your existing protected route wrapper

function App() {
   return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes with DashboardLayout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard (Organizations) */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/organizations/:orgId" element={<Dashboard />} />
          
          {/* Activity */}
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/organizations/:orgId/activity" element={<ActivityPage />} />
          
          {/* Settings */}
          <Route path="/organizations/:id/settings" element={<OrganizationSettings />} />
          
          {/* Board View - maybe outside Layout if we want full screen, 
              but usually inside layout or with a different layout. 
              Trello keeps sidebar mostly collapsed or absent on board view? 
              Requests say "Dashboard Layout: A responsive sidebar...".
              Usually Board view has its own sidebar or no sidebar.
              Let's put it inside layout for now for consistency of "User Workspaces".
          */}
          {/* Board View */}
          <Route path="/board/:id" element={<Board />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/organizations" element={<OrganizationManagement />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
