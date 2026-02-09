import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Assuming default export instance
import { toast } from 'sonner';

const OrganizationContext = createContext();

export const OrganizationProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
        setLoading(false);
        return;
    }
    try {
      console.log('Fetching organizations...');
      const response = await api.get('/organizations');
      console.log('Organizations fetched:', response.data);
      setOrganizations(response.data);
      
      // Set default org if none selected or current invalid
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      if (response.data.length > 0) {
        const found = response.data.find(o => o.id === parseInt(savedOrgId));
        setCurrentOrganization(found || response.data[0]);
      } else {
        setCurrentOrganization(null);
      }
    } catch (error) {
      console.error('Failed to fetch organizations', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganizationId', currentOrganization.id);
    }
  }, [currentOrganization]);

  const createOrganization = async (data) => {
    try {
      const response = await api.post('/organizations', data);
      setOrganizations([...organizations, response.data]);
      setCurrentOrganization(response.data);
      toast.success('Organization created');
      return response.data;
    } catch (error) {
      console.error('Failed to create organization', error);
      throw error;
    }
  };

  const value = {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    createOrganization,
    fetchOrganizations,
    loading
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
