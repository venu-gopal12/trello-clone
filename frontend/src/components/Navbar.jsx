import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout, isAuthenticated } from '../lib/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>Trello Clone</Link>

      <div style={styles.right}>
        {isAuthenticated() ? (
          <>
            <span style={styles.user}>
              {user?.username || user?.email}
            </span>
            <button style={styles.logout} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    backgroundColor: 'rgba(0,0,0,0.32)', // Trello style
    color: 'white',
    height: '40px',
  },
  brand: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff',
    textDecoration: 'none',
    opacity: 0.85,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  user: {
    fontSize: '14px',
    opacity: 0.85,
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    opacity: 0.85,
  },
  logout: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};

export default Navbar;
