import './AnalyticsCard.css';

const AnalyticsCard = ({ title, value, icon, trend, trendValue, color = '#667eea' }) => {
  return (
    <div className="analytics-card" style={{ borderTopColor: color }}>
      <div className="analytics-card-header">
        <div className="analytics-icon" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        <h3>{title}</h3>
      </div>
      <div className="analytics-value">{value}</div>
      {trend && (
        <div className={`analytics-trend ${trend}`}>
          <span className="trend-icon">{trend === 'up' ? '↑' : '↓'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsCard;
