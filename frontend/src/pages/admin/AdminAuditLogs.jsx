import { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import { toast } from 'sonner';
import './AdminAuditLogs.css';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    actionType: ''
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs(filters);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load audit logs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionFilter = (e) => {
    setFilters({ ...filters, actionType: e.target.value, page: 1 });
  };

  const getActionIcon = (actionType) => {
    const icons = {
      suspend_user: '🚫',
      activate_user: '✅',
      change_role: '🔄',
      delete_user: '🗑️',
      delete_organization: '🏢🗑️'
    };
    return icons[actionType] || '📝';
  };

  const getActionColor = (actionType) => {
    const colors = {
      suspend_user: '#ef4444',
      activate_user: '#10b981',
      change_role: '#3b82f6',
      delete_user: '#dc2626',
      delete_organization: '#dc2626'
    };
    return colors[actionType] || '#64748b';
  };

  const formatActionType = (actionType) => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDetails = (details) => {
    if (!details) return null;
    
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return (
        <div className="details-content">
          {Object.entries(parsed).map(([key, value]) => (
            <div key={key} className="detail-item">
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>
      );
    } catch {
      return <span>{String(details)}</span>;
    }
  };

  return (
    <div className="admin-audit-logs">
      <div className="page-header">
        <h1>Admin Audit Logs</h1>
        <p>Track all administrative actions on the platform</p>
      </div>

      <div className="filters">
        <select value={filters.actionType} onChange={handleActionFilter} className="filter-select">
          <option value="">All Actions</option>
          <option value="suspend_user">Suspend User</option>
          <option value="activate_user">Activate User</option>
          <option value="change_role">Change Role</option>
          <option value="delete_user">Delete User</option>
          <option value="delete_organization">Delete Organization</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading audit logs...</div>
      ) : (
        <>
          <div className="logs-container">
            {logs.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-icon" style={{ color: getActionColor(log.action_type) }}>
                  {getActionIcon(log.action_type)}
                </div>
                <div className="log-content">
                  <div className="log-header">
                    <span className="log-action" style={{ color: getActionColor(log.action_type) }}>
                      {formatActionType(log.action_type)}
                    </span>
                    <span className="log-time">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="log-meta">
                    <span>Admin: <strong>{log.admin_username || 'Unknown'}</strong></span>
                    <span>Target: <strong>{log.target_entity_type} #{log.target_entity_id}</strong></span>
                  </div>
                  {log.details && formatDetails(log.details)}
                </div>
              </div>
            ))}
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

export default AdminAuditLogs;
