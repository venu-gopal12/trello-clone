import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards');
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const { data } = await api.post('/boards', { title: newBoardTitle });
      setBoards([...boards, data]);
      setNewBoardTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create board', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container" style={styles.container}>
      <h2 style={styles.header}>Your Boards</h2>
      <div style={styles.grid}>
        {boards.map(board => (
          <Link key={board.id} to={`/board/${board.id}`} style={{...styles.card, backgroundColor: board.background_color || '#0079bf'}}>
            <h3 style={styles.title}>{board.title}</h3>
          </Link>
        ))}
        
        {/* Create Board Tile */}
        {!isCreating ? (
            <div style={styles.createCard} onClick={() => setIsCreating(true)}>
                <h3 style={styles.createTitle}>Create new board</h3>
            </div>
        ) : (
            <div style={{...styles.createCard, cursor: 'default', backgroundColor: '#f4f5f7'}}>
                <form onSubmit={handleCreateBoard} style={styles.form}>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Board title" 
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        style={styles.input}
                        onBlur={() => !newBoardTitle && setIsCreating(false)} 
                    />
                    <div style={styles.actions}>
                        <button type="submit" style={styles.button}>Create</button>
                        <button type="button" onClick={() => setIsCreating(false)} style={styles.cancelButton}>X</button>
                    </div>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '860px',
    margin: '0 auto',
  },
  header: {
    color: '#172b4d',
    marginBottom: '20px',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  },
  card: {
    width: '200px',
    height: '100px',
    padding: '16px',
    borderRadius: '4px',
    color: 'white',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'opacity 0.2s',
    ':hover': {
        opacity: 0.9
    }
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    wordWrap: 'break-word',
    overflow: 'hidden',
  },
  createCard: {
    width: '200px',
    height: '100px',
    padding: '16px',
    borderRadius: '4px',
    backgroundColor: '#091e420a',
    color: '#172b4d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  createTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '400',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '2px solid #0079bf',
    marginBottom: '8px',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    backgroundColor: '#0079bf',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  cancelButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6b778c',
  }
};

export default Dashboard;
