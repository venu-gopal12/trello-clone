import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>Trello Clone</Link>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: 'rgba(0,0,0,0.32)', // Trello standard semi-transparent dark on board
    color: 'white',
    height: '40px',
  },
  brand: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff', 
    textDecoration: 'none',
    opacity: 0.8,
  }
};

export default Navbar;
