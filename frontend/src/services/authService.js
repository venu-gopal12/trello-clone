import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/users/login', { email, password });
  return data;
};

export const register = async (username, email, password) => {
  const { data } = await api.post('/users/register', {
    username,
    email,
    password,
  });
  return data;
};
