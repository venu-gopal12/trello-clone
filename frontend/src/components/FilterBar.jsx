import React from 'react';

const FilterBar = ({ filters, setFilters, availableLabels, availableMembers }) => {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      labelId: '',
      memberId: '',
      dueMode: '' // 'overdue', 'dueSoon', 'noDate'
    });
  };

  const hasActiveFilters = filters.keyword || filters.labelId || filters.memberId || filters.dueMode;

  return (
    <div style={styles.container}>
      <div style={styles.group}>
        <input 
          style={styles.input}
          placeholder="Search cards..."
          value={filters.keyword}
          onChange={(e) => handleChange('keyword', e.target.value)}
        />
      </div>

      <div style={styles.group}>
        <select 
            style={styles.select}
            value={filters.labelId}
            onChange={(e) => handleChange('labelId', e.target.value)}
        >
            <option value="">Filter by Label</option>
            {availableLabels.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
            ))}
        </select>
      </div>

      <div style={styles.group}>
         <select 
            style={styles.select}
            value={filters.memberId}
            onChange={(e) => handleChange('memberId', e.target.value)}
        >
            <option value="">Filter by Member</option>
            {availableMembers.map(m => (
                <option key={m.id} value={m.id}>{m.username}</option>
            ))}
        </select>
      </div>

      <div style={styles.group}>
         <select 
            style={styles.select}
            value={filters.dueMode}
            onChange={(e) => handleChange('dueMode', e.target.value)}
        >
            <option value="">Filter by Date</option>
            <option value="dueSoon">Due within 24h</option>
            <option value="overdue">Overdue</option>
            <option value="noDate">No Date</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button style={styles.clearBtn} onClick={clearFilters}>
            X Clear Filters
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 24px 12px', // below header
    background: 'rgba(0,0,0,0.1)', // Subtle backdrop
    flexWrap: 'wrap',
  },
  group: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    padding: '6px 12px',
    borderRadius: '3px',
    border: 'none',
    fontSize: '14px',
    minWidth: '200px',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '3px',
    border: 'none',
    fontSize: '14px',
    backgroundColor: 'rgba(255,255,255,0.9)',
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '6px 12px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginLeft: 'auto', // push to right
    ':hover': {
        backgroundColor: 'rgba(255,255,255,0.5)',
    }
  }
};

export default FilterBar;
