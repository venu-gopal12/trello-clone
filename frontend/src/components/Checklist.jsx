import React, { useState } from 'react';
import api from '../services/api';

const Checklist = ({ checklist, onUpdate, onDelete }) => {
    const [newItemContent, setNewItemContent] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);

    const handleAddItem = async () => {
        if (!newItemContent.trim()) return;
        try {
            const { data: newItem } = await api.post(`/checklists/${checklist.id}/items`, { content: newItemContent });
            onUpdate({ ...checklist, items: [...(checklist.items || []), newItem] });
            setNewItemContent('');
            setIsAddingItem(false);
        } catch (error) {
            console.error('Failed to add item', error);
        }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await api.delete(`/checklists/items/${itemId}`);
            onUpdate({ ...checklist, items: checklist.items.filter(i => i.id !== itemId) });
        } catch (error) {
            console.error('Failed to delete item', error);
        }
    };

    const handleToggleItem = async (item) => {
        try {
            const updatedItem = { ...item, is_completed: !item.is_completed };
            await api.put(`/checklists/items/${item.id}`, { is_completed: updatedItem.is_completed });
            onUpdate({ 
                ...checklist, 
                items: checklist.items.map(i => i.id === item.id ? updatedItem : i) 
            });
        } catch (error) {
            console.error('Failed to toggle item', error);
        }
    };

    const handleDeleteChecklist = async () => {
        if (confirm('Delete this checklist?')) {
            try {
                await api.delete(`/checklists/${checklist.id}`);
                onDelete(checklist.id);
            } catch (error) {
                console.error('Failed to delete checklist', error);
            }
        }
    };

    const items = checklist.items || [];
    const completedCount = items.filter(i => i.is_completed).length;
    const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.titleSection}>
                    <span style={styles.icon}>☑</span>
                    <h3 style={styles.title}>{checklist.title}</h3>
                </div>
                <button style={styles.deleteBtn} onClick={handleDeleteChecklist}>Delete</button>
            </div>

            <div style={styles.progressBarContainer}>
                <span style={styles.progressText}>{progress}%</span>
                <div style={styles.progressBarTrack}>
                    <div style={{...styles.progressBarFill, width: `${progress}%`}}></div>
                </div>
            </div>

            <div style={styles.itemsList}>
                {items.map(item => (
                    <div key={item.id} style={styles.item}>
                        <input 
                            type="checkbox" 
                            checked={item.is_completed} 
                            onChange={() => handleToggleItem(item)}
                            style={styles.checkbox}
                        />
                        <span style={{
                            ...styles.itemText, 
                            textDecoration: item.is_completed ? 'line-through' : 'none',
                            color: item.is_completed ? '#5e6c84' : '#172b4d'
                        }}>
                            {item.content}
                        </span>
                        <span style={styles.deleteItemBtn} onClick={() => handleDeleteItem(item.id)}>×</span>
                    </div>
                ))}
            </div>

            {!isAddingItem ? (
                <button style={styles.addItemBtn} onClick={() => setIsAddingItem(true)}>Add an item</button>
            ) : (
                <div style={styles.addItemForm}>
                    <input 
                        autoFocus
                        placeholder="Add an item" 
                        style={styles.addItemInput}
                        value={newItemContent}
                        onChange={e => setNewItemContent(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleAddItem();
                            if (e.key === 'Escape') setIsAddingItem(false);
                        }}
                    />
                    <div style={styles.actions}>
                        <button style={styles.confirmBtn} onClick={handleAddItem}>Add</button>
                        <button style={styles.cancelBtn} onClick={() => setIsAddingItem(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        marginBottom: '24px',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    titleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    icon: {
        fontSize: '20px',
        color: '#42526e',
    },
    title: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: '#172b4d',
    },
    deleteBtn: {
        backgroundColor: '#e2e4e9',
        border: 'none',
        borderRadius: '3px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#172b4d',
    },
    progressBarContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    progressText: {
        fontSize: '11px',
        color: '#5e6c84',
        width: '32px',
    },
    progressBarTrack: {
        flex: 1,
        height: '8px',
        backgroundColor: '#dfe1e6',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#5ba4cf',
        transition: 'width 0.2s',
    },
    itemsList: {
        marginBottom: '12px',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        padding: '6px 0',
        gap: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        ':hover': {
            backgroundColor: '#f4f5f7',
        } // hover tricky inline
    },
    checkbox: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
    },
    itemText: {
        flex: 1,
    },
    deleteItemBtn: {
        cursor: 'pointer',
        fontSize: '18px',
        color: '#6b778c',
        padding: '0 8px',
        ':hover': { color: '#eb5a46' }
    },
    addItemBtn: {
        backgroundColor: '#e2e4e9',
        border: 'none',
        borderRadius: '3px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontWeight: 500,
        color: '#172b4d',
    },
    addItemForm: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    addItemInput: {
        padding: '8px',
        borderRadius: '3px',
        border: '2px solid #0079bf',
        outline: 'none',
    },
    actions: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },
    confirmBtn: {
        backgroundColor: '#0079bf',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '3px',
        cursor: 'pointer',
    },
    cancelBtn: {
        background: 'none',
        border: 'none',
        color: '#172b4d',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '0 8px',
    }
};

export default Checklist;
