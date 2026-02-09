import { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';
import AnalyticsCard from '../../components/admin/AnalyticsCard';
import { toast } from 'sonner';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      console.log('Fetching analytics...'); // DEBUG
      const data = await adminApi.getAnalytics();
      console.log('Analytics data received:', data); // DEBUG
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error); // DEBUG
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and statistics</p>
        <button onClick={loadAnalytics} style={{ marginTop: '10px', padding: '5px 10px', cursor: 'pointer' }}>
          🔄 Refresh Data
        </button>
      </div>

      <div className="analytics-grid">
        <AnalyticsCard
          title="Total Users"
          value={analytics?.totalUsers || 0}
          icon="👥"
          color="#667eea"
          trend="up"
          trendValue={`+${analytics?.recentSignups || 0} this week`}
        />
        <AnalyticsCard
          title="Active Users"
          value={analytics?.activeUsers || 0}
          icon="⚡"
          color="#10b981"
          trend="up"
          trendValue="Last 30 days"
        />
        <AnalyticsCard
          title="Organizations"
          value={analytics?.totalOrganizations || 0}
          icon="🏢"
          color="#f59e0b"
        />
        <AnalyticsCard
          title="Total Boards"
          value={analytics?.totalBoards || 0}
          icon="📋"
          color="#3b82f6"
        />
        <AnalyticsCard
          title="Total Cards"
          value={analytics?.totalCards || 0}
          icon="📝"
          color="#8b5cf6"
        />
        <AnalyticsCard
          title="Suspended Users"
          value={analytics?.suspendedUsers || 0}
          icon="🚫"
          color="#ef4444"
        />
      </div>

      {analytics?.userGrowth && analytics.userGrowth.length > 0 && (
        <div className="growth-section">
          <h2>User Growth (Last 30 Days)</h2>
          <div className="growth-chart">
            {analytics.userGrowth.map((day, index) => (
              <div key={index} className="growth-bar">
                <div 
                  className="bar" 
                  style={{ height: `${Math.max(day.count * 20, 10)}px` }}
                  title={`${day.date}: ${day.count} users`}
                />
                <span className="bar-label">{new Date(day.date).getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
