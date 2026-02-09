import { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import { toast } from 'sonner';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add error state
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    role: '',
    suspended: ''
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      console.log('Fetching users with filters:', filters); // DEBUG
      setLoading(true);
      setError(null); // Clear previous errors
      const data = await adminApi.getAllUsers(filters);
      console.log('Users data received:', data); // DEBUG
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error loading users:', error); // DEBUG
      setError(error.message || 'Failed to load users'); // Set error message
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleRoleFilter = (e) => {
    setFilters({ ...filters, role: e.target.value, page: 1 });
  };

  const handleSuspendedFilter = (e) => {
    setFilters({ ...filters, suspended: e.target.value, page: 1 });
  };

  const handleSuspendUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to suspend ${username}?`)) return;
    
    try {
      await adminApi.suspendUser(userId, 'Suspended by admin');
      toast.success('User suspended successfully');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId, username) => {
    try {
      await adminApi.activateUser(userId);
      toast.success('User activated successfully');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to activate user');
    }
  };

  const handleChangeRole = async (userId, currentRole, username) => {
    const newRole = prompt(`Change role for ${username}\nCurrent: ${currentRole}\nEnter new role (user/admin/super_admin):`);
    
    if (!newRole || !['user', 'admin', 'super_admin'].includes(newRole)) {
      toast.error('Invalid role');
      return;
    }

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`⚠️ Are you sure you want to DELETE ${username}?\n\nThis action cannot be undone and will remove all their data.`)) return;
    
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super_admin': return 'badge-super-admin';
      case 'admin': return 'badge-admin';
      default: return 'badge-user';
    }
  };

  return (
    <div className="user-management">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h1>User Management</h1>
                <p>Manage all users on the platform</p>
            </div>
            <button onClick={loadUsers} style={{ padding: '8px 16px', background: '#e2e8f0', borderRadius: '6px', fontWeight: '500' }}>
               🔄 Refresh
            </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' }}>
            <strong>Error:</strong> {error}
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={filters.search}
          onChange={handleSearch}
          className="search-input"
        />
        <select value={filters.role} onChange={handleRoleFilter} className="filter-select">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select value={filters.suspended} onChange={handleSuspendedFilter} className="filter-select">
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{user.username[0].toUpperCase()}</div>
                        <span>{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_suspended ? 'suspended' : 'active'}`}>
                        {user.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {user.is_suspended ? (
                          <button 
                            className="btn-activate"
                            onClick={() => handleActivateUser(user.id, user.username)}
                          >
                            Activate
                          </button>
                        ) : (
                          <button 
                            className="btn-suspend"
                            onClick={() => handleSuspendUser(user.id, user.username)}
                          >
                            Suspend
                          </button>
                        )}
                        <button 
                          className="btn-role"
                          onClick={() => handleChangeRole(user.id, user.role, user.username)}
                        >
                          Change Role
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={pagination.page === 1}
                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement;
