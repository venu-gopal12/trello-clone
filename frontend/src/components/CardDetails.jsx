import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Checklist from './Checklist';

const CardDetails = ({ cardId, listTitle, onClose, onUpdate, onDelete, onCopy, boardLabels = [] }) => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState('');
  
  // UI State for Popovers
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('Checklist');

  // Mock Data (In real app, fetch from board/users)
  const [activity, setActivity] = useState([]);
  
  // Use passed boardLabels instead of mock
  const availableLabels = boardLabels;
  
  const availableMembers = [
    { id: 1, username: 'testuser', avatar_url: 'https://placehold.co/30x30' },
    { id: 2, username: 'alice', avatar_url: 'https://placehold.co/30x30' },
  ];

  useEffect(() => {
    fetchCardDetails();
    fetchActivity();
  }, [cardId]);

  const fetchActivity = async () => {
      try {
          const { data } = await api.get(`/cards/${cardId}/activity`);
          setActivity(data);
      } catch (e) {
          console.error("Failed to fetch activity", e);
      }
  };

  const fetchCardDetails = async () => {
    try {
      const { data } = await api.get(`/cards/${cardId}`);
      setCard(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch card details', error);
    }
  };

  const handleTitleBlur = async () => {
    setEditingTitle(false);
    if (title !== card.title) {
        try {
            await api.put(`/cards/${cardId}`, { title });
            const updated = { ...card, title };
            setCard(updated);
            onUpdate(updated);
            fetchActivity();
        } catch (e) {
            console.error('Failed to update title', e);
        }
    }
  };

  const handleDescSave = async () => {
    try {
        await api.put(`/cards/${cardId}`, { description });
        setCard({ ...card, description });
        setEditingDesc(false);
        fetchActivity();
    } catch (e) {
        console.error('Failed to update desc', e);
    }
  };

  const toggleLabel = async (labelId) => {
    const hasLabel = card.labels.some(l => l.id === labelId);
    try {
        if (hasLabel) {
            await api.delete(`/cards/${cardId}/labels/${labelId}`);
            setCard({ ...card, labels: card.labels.filter(l => l.id !== labelId) });
        } else {
            const labelToAdd = availableLabels.find(l => l.id === labelId);
            await api.post(`/cards/${cardId}/labels`, { label_id: labelId });
            setCard({ ...card, labels: [...card.labels, labelToAdd] });
        }
        fetchActivity();
    } catch (e) {
        console.error('Failed to toggle label', e);
    }
  };

  const toggleMember = async (userId) => {
    const hasMember = card.members.some(m => m.id === userId);
    try {
        if (hasMember) {
            await api.delete(`/cards/${cardId}/members/${userId}`);
            setCard({ ...card, members: card.members.filter(m => m.id !== userId) });
        } else {
            const memberToAdd = availableMembers.find(m => m.id === userId);
            await api.post(`/cards/${cardId}/members`, { user_id: userId });
            setCard({ ...card, members: [...card.members, memberToAdd] });
        }
        fetchActivity();
    } catch (e) {
        console.error('Failed to toggle member', e);
    }
  };

  const handleDateChange = async (e) => {
      const date = e.target.value;
      try {
          await api.put(`/cards/${cardId}`, { due_date: date });
          setCard({ ...card, due_date: date });
          setShowDatePicker(false);
          fetchActivity();
      } catch (e) {
          console.error('Failed to set date', e);
      }
  };

  const handleAddChecklist = async () => {
      try {
          const { data: checklist } = await api.post('/checklists', { card_id: cardId, title: newChecklistTitle });
          setCard({ ...card, checklists: [...(card.checklists || []), { ...checklist, items: [] }] });
          setShowChecklistPopover(false);
          setNewChecklistTitle('Checklist');
          fetchActivity();
      } catch (e) {
          console.error('Failed to add checklist', e);
      }
  };

  const handleChecklistUpdate = (updatedChecklist) => {
      setCard({
          ...card,
          checklists: card.checklists.map(cl => cl.id === updatedChecklist.id ? updatedChecklist : cl)
      });
  };

  const handleChecklistDelete = (checklistId) => {
      setCard({
          ...card,
          checklists: card.checklists.filter(cl => cl.id !== checklistId)
      });
      fetchActivity();
  };

  if (loading) return <div>Loading details...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.icon}>📇</div>
        <div style={styles.titleSection}>
            {editingTitle ? (
                <input 
                    autoFocus
                    style={styles.titleInput}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                />
            ) : (
                <h2 style={styles.title} onClick={() => setEditingTitle(true)}>{title}</h2>
            )}
            <div style={styles.subtitle}>in list <u>{listTitle}</u></div>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.contentColumn}>
            {/* Meta Data Row: Members, Labels, Due Date */}
            <div style={styles.metaRow}>
                {card.members && card.members.length > 0 && (
                    <div style={styles.metaItem}>
                        <h4>Members</h4>
                        <div style={styles.membersList}>
                            {card.members.map(m => (
                                <img key={m.id} src={m.avatar_url} style={styles.avatar} title={m.username} />
                            ))}
                            <div style={styles.addMetaBtn} onClick={() => setShowMemberPicker(!showMemberPicker)}>+</div>
                        </div>
                    </div>
                )}
                
                {card.labels && card.labels.length > 0 && (
                    <div style={styles.metaItem}>
                        <h4>Labels</h4>
                        <div style={styles.labelsList}>
                            {card.labels.map(l => (
                                <div key={l.id} style={{...styles.labelChip, backgroundColor: l.color}}>{l.name}</div>
                            ))}
                            <div style={styles.addMetaBtn} onClick={() => setShowLabelPicker(!showLabelPicker)}>+</div>
                        </div>
                    </div>
                )}

                {card.due_date && (
                    <div style={styles.metaItem}>
                        <h4>Due Date</h4>
                        <div style={styles.dateDisplay} onClick={() => setShowDatePicker(true)}>
                            {new Date(card.due_date).toLocaleDateString()}
                        </div>
                    </div>
                )}
            </div>


            {/* Description */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <span style={styles.icon}>≡</span>
                    <h3>Description</h3>
                </div>
                {editingDesc ? (
                    <div style={styles.editor}>
                        <textarea 
                            autoFocus
                            style={styles.textArea}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={5}
                        />
                        <div style={styles.actions}>
                            <button style={styles.primaryBtn} onClick={handleDescSave}>Save</button>
                            <button style={styles.textBtn} onClick={() => setEditingDesc(false)}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div style={styles.descDisplay} onClick={() => setEditingDesc(true)}>
                        {description || 'Add a more detailed description...'}
                    </div>
                )}
            </div>
            
            {card.checklists && card.checklists.map(cl => (
                <Checklist 
                    key={cl.id} 
                    checklist={cl} 
                    onUpdate={handleChecklistUpdate} 
                    onDelete={handleChecklistDelete} 
                />
            ))}

            {/* Activity Log */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <span style={styles.icon}>⚡</span>
                    <h3>Activity</h3>
                </div>
                <div style={styles.activityList}>
                    {activity.map(log => (
                        <div key={log.id} style={styles.activityItem}>
                            <img src={log.avatar_url || 'https://placehold.co/30x30'} style={styles.activityAvatar} alt="user" />
                            <div style={styles.activityContent}>
                                <div style={styles.activityText}>
                                    <span style={{fontWeight: 600}}>{log.username || 'Unknown'}</span>{' '}
                                    {formatLogMessage(log)}
                                </div>
                                <div style={styles.activityDate}>{new Date(log.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                    {activity.length === 0 && <div style={{color: '#5e6c84', fontStyle: 'italic'}}>No activity yet.</div>}
                </div>
            </div>
        </div>

        <div style={styles.sidebarColumn}>
            <div style={styles.sidebarSection}>
                <h4>Add to card</h4>
                
                {/* Members Picker */}
                <div style={{position: 'relative'}}>
                    <button style={styles.sidebarBtn} onClick={() => setShowMemberPicker(!showMemberPicker)}>👤 Members</button>
                    {showMemberPicker && (
                        <div style={styles.popover}>
                            <div style={styles.popoverHeader}>Members <span style={styles.closePop} onClick={() => setShowMemberPicker(false)}>&times;</span></div>
                            {availableMembers.map(m => (
                                <div key={m.id} style={styles.popoverItem} onClick={() => toggleMember(m.id)}>
                                    {card.members.some(cm => cm.id === m.id) && <span>✓ </span>}
                                    {m.username}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Label Picker */}
                <div style={{position: 'relative'}}>
                    <button style={styles.sidebarBtn} onClick={() => setShowLabelPicker(!showLabelPicker)}>🏷️ Labels</button>
                    {showLabelPicker && (
                         <div style={styles.popover}>
                            <div style={styles.popoverHeader}>Labels <span style={styles.closePop} onClick={() => setShowLabelPicker(false)}>&times;</span></div>
                            {availableLabels.map(l => (
                                <div key={l.id} style={styles.popoverItem} onClick={() => toggleLabel(l.id)}>
                                    <div style={{...styles.colorBox, backgroundColor: l.color}}></div>
                                    {l.name}
                                    {card.labels.some(cl => cl.id === l.id) && <span style={{marginLeft: 'auto'}}>✓</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date Picker */}
                <div style={{position: 'relative'}}>
                    <button style={styles.sidebarBtn} onClick={() => setShowDatePicker(!showDatePicker)}>🕒 Dates</button>
                    {showDatePicker && (
                        <div style={styles.popover}>
                            <div style={styles.popoverHeader}>Due Date <span style={styles.closePop} onClick={() => setShowDatePicker(false)}>&times;</span></div>
                            <input type="date" style={styles.dateInput} onChange={handleDateChange} />
                        </div>
                    )}
                </div>
                
                <div style={{position: 'relative'}}>
                    <button style={styles.sidebarBtn} onClick={() => setShowChecklistPopover(!showChecklistPopover)}>☑ Checklist</button>
                    {showChecklistPopover && (
                        <div style={styles.popover}>
                            <div style={styles.popoverHeader}>Add Checklist <span style={styles.closePop} onClick={() => setShowChecklistPopover(false)}>&times;</span></div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <label style={{fontSize: '12px', fontWeight: 700, color: '#5e6c84'}}>Title</label>
                                <input 
                                    style={styles.dateInput} 
                                    value={newChecklistTitle} 
                                    onChange={(e) => setNewChecklistTitle(e.target.value)} 
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddChecklist();
                                    }}
                                />
                                <button style={styles.primaryBtn} onClick={handleAddChecklist}>Add</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div style={styles.sidebarSection}>
                <h4>Actions</h4>
                <button style={styles.sidebarBtn} title="Use Drag and Drop to move cards">➡️ Move (DnD)</button>
                <button style={styles.sidebarBtn} onClick={onCopy}>📋 Copy</button>
                <button style={styles.sidebarBtn} onClick={onDelete}>🗑️ Delete</button>
            </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    color: '#172b4d',
    fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans,Ubuntu,Droid Sans,Helvetica Neue,sans-serif'
  },
  header: {
    display: 'flex',
    marginBottom: '24px',
    gap: '16px',
  },
  icon: {
    fontSize: '24px',
    marginTop: '4px',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  titleInput: {
    fontSize: '20px',
    fontWeight: 600,
    width: '100%',
    padding: '4px',
    border: '2px solid #0079bf',
    borderRadius: '3px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#5e6c84',
    marginTop: '4px',
  },
  mainContent: {
    display: 'flex',
    gap: '32px',
  },
  contentColumn: {
    flex: 3,
  },
  sidebarColumn: {
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  metaItem: {
      marginRight: '16px',
  },
  membersList: {
      display: 'flex',
      gap: '4px',
      marginTop: '4px',
  },
  labelsList: {
    display: 'flex',
    gap: '4px',
    marginTop: '4px',
    flexWrap: 'wrap',
  },
  avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
  },
  labelChip: {
      padding: '4px 8px',
      borderRadius: '3px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px',
  },
  dateDisplay: {
      padding: '4px 8px',
      backgroundColor: '#e2e4e9',
      borderRadius: '3px',
      marginTop: '4px',
      cursor: 'pointer',
  },
  addMetaBtn: {
      width: '32px',
      height: '32px',
      backgroundColor: '#e2e4e9',
      borderRadius: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '20px',
      color: '#42526e',
      ':hover': { backgroundColor: '#d0d4da' } // pseudo not supported like this in inline styles, logic needed
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  descDisplay: {
    backgroundColor: '#091e420a',
    minHeight: '40px',
    padding: '8px 12px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '20px',
    ':hover': {
        backgroundColor: '#091e4214',
    }
  },
  editor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  textArea: {
    width: '100%',
    padding: '8px',
    borderRadius: '3px',
    border: '2px solid #0079bf',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#0079bf',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  textBtn: {
    background: 'none',
    border: 'none',
    color: '#172b4d',
    cursor: 'pointer',
    padding: '6px 12px',
  },
  sidebarSection: {
    marginBottom: '24px',
  },
  sidebarBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '6px 12px',
    marginBottom: '8px',
    backgroundColor: '#091e420a',
    border: 'none',
    borderRadius: '3px',
    color: '#172b4d',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.1s',
  },
  // Popover Styles
  popover: {
      position: 'absolute',
      top: '100%',
      left: 0,
      width: '304px',
      backgroundColor: 'white',
      borderRadius: '3px',
      boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)',
      zIndex: 100,
      padding: '12px',
  },
  popoverHeader: {
      borderBottom: '1px solid #dfe1e6',
      marginBottom: '8px',
      paddingBottom: '8px',
      textAlign: 'center',
      color: '#5e6c84',
      fontSize: '14px',
      position: 'relative',
  },
  closePop: {
      position: 'absolute',
      right: 0,
      top: 0,
      cursor: 'pointer',
  },
  popoverItem: {
      padding: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      // hover effect requires CSS or state
  },
  colorBox: {
      width: '24px',
      height: '24px',
      borderRadius: '3px',
  },
  dateInput: {
      width: '100%',
      padding: '8px',
      borderRadius: '3px',
      border: '1px solid #dfe1e6',
  },
  activityList: {
      marginTop: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
  },
  activityItem: {
      display: 'flex',
      gap: '12px',
      fontSize: '14px',
      alignItems: 'flex-start',
  },
  activityAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      cursor: 'pointer',
  },
  activityContent: {
      flex: 1,
  },
  activityText: {
      color: '#172b4d',
  },
  activityDate: {
      fontSize: '12px',
      color: '#5e6c84',
      marginTop: '4px',
  }
};

const formatLogMessage = (log) => {
    const { action_type, details } = log;
    if (action_type === 'create') return `added this card`;
    if (action_type === 'move') {
        if (details.list_id) return `moved this card to another list`;
        return `moved this card`;
    }
    if (action_type === 'rename') return `renamed this card`;
    if (action_type === 'update') {
        if (details.description_changed) return `updated the description`;
        return `updated this card`;
    }
    return `performed ${action_type}`;
};

export default CardDetails;
