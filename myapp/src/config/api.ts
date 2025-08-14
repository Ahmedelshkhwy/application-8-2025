// API configuration using environment variables only
// All IP addresses are configured in .env file

// Get API base URL from environment variable
const getAPIBaseURL = (): string => {
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
};

// Export the API base URL
export const API_BASE = getAPIBaseURL();

// Simple health check using configured URL
export const checkAPIHealth = async (): Promise<boolean> => {
  try {
    console.log('🔍 Testing API connectivity:', `${API_BASE}/health`);
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error: any) {
    console.log('❌ API Health Check Failed:', error.message);
    return false;
  }
};
