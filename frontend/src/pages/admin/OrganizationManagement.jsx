import { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import { toast } from 'sonner';
import './OrganizationManagement.css';

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: ''
  });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, [filters]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAllOrganizations(filters);
      setOrganizations(data.organizations);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load organizations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleViewDetails = async (orgId) => {
    try {
      const data = await adminApi.getOrganizationById(orgId);
      setSelectedOrg(data);
      setShowDetails(true);
    } catch (error) {
      toast.error('Failed to load organization details');
    }
  };

  const handleDeleteOrganization = async (orgId, orgName) => {
    if (!confirm(`⚠️ Are you sure you want to DELETE "${orgName}"?\n\nThis will permanently delete:\n- All boards in this organization\n- All lists and cards\n- All organization data\n\nThis action cannot be undone!`)) return;
    
    try {
      await adminApi.deleteOrganization(orgId);
      toast.success('Organization deleted successfully');
      loadOrganizations();
      if (showDetails && selectedOrg?.id === orgId) {
        setShowDetails(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete organization');
    }
  };

  return (
    <div className="organization-management">
      <div className="page-header">
        <h1>Organization Management</h1>
        <p>Manage all organizations on the platform</p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name or slug..."
          value={filters.search}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">Loading organizations...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="orgs-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Slug</th>
                  <th>Members</th>
                  <th>Boards</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id}>
                    <td>
                      <div className="org-cell">
                        <div className="org-icon">🏢</div>
                        <span>{org.name}</span>
                      </div>
                    </td>
                    <td><code>{org.slug}</code></td>
                    <td>{org.member_count}</td>
                    <td>{org.board_count}</td>
                    <td>{new Date(org.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-view"
                          onClick={() => handleViewDetails(org.id)}
                        >
                          View Details
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteOrganization(org.id, org.name)}
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

      {showDetails && selectedOrg && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedOrg.name}</h2>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Slug:</strong>
                <code>{selectedOrg.slug}</code>
              </div>
              <div className="detail-row">
                <strong>Created:</strong>
                <span>{new Date(selectedOrg.created_at).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <strong>Total Members:</strong>
                <span>{selectedOrg.member_count}</span>
              </div>
              <div className="detail-row">
                <strong>Total Boards:</strong>
                <span>{selectedOrg.board_count}</span>
              </div>

              <h3>Members</h3>
              <div className="members-list">
                {selectedOrg.members?.map(member => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <div className="member-avatar">{member.username[0].toUpperCase()}</div>
                      <div>
                        <div className="member-name">{member.username}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                    </div>
                    <span className={`role-badge ${member.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
