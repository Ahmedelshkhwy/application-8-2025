import { API_BASE, checkAPIHealth } from './api';

// API configuration object
export const apiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  
  // Function to check API health
  checkHealth: async () => {
    try {
      return await checkAPIHealth();
    } catch (error) {
      console.log('⚠️ Could not check API health');
      return false;
    }
  },

  // Initialize the config
  initialize: async () => {
    await apiConfig.checkHealth();
  }
};

// Initialize the config immediately
apiConfig.initialize().catch(console.error);

// Helper function to get full API URL
export const getAPIUrl = (endpoint: string): string => {
  return `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};
