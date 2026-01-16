import axios from 'axios';

const api = axios.create({
  baseURL: 'https://trello-clone-1o5t.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
