import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <span className="admin-icon">⚡</span>
            <h2>Admin Panel</h2>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📊</span>
            {isSidebarOpen && <span>Dashboard</span>}
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">👥</span>
            {isSidebarOpen && <span>Users</span>}
          </NavLink>
          <NavLink to="/admin/organizations" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">🏢</span>
            {isSidebarOpen && <span>Organizations</span>}
          </NavLink>
          <NavLink to="/admin/audit-logs" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">📝</span>
            {isSidebarOpen && <span>Audit Logs</span>}
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="back-button" onClick={handleBackToDashboard}>
            <span className="nav-icon">←</span>
            {isSidebarOpen && <span>Back to Dashboard</span>}
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
