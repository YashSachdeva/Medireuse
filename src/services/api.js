const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for making API requests
const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token and user info
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Fetch complete user data
      const userData = await authAPI.getMe();
      if (userData.user) {
        localStorage.setItem('user', JSON.stringify(userData.user));
      }
    }
    
    return data;
  },

  // Login user
  login: async (credentials) => {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store token and user info
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Fetch complete user data including phone and address
      const userData = await authAPI.getMe();
      if (userData.user) {
        localStorage.setItem('user', JSON.stringify(userData.user));
      }
    }
    
    return data;
  },

  // Get current user from backend
  getMe: async () => {
    return await fetchAPI('/auth/me');
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const data = await fetchAPI('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    
    // Update stored user data
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Admin-specific API helpers (requires authenticated admin user)
export const adminAPI = {
  // fetches all users; backend will enforce protect+admin
  getUsers: async () => {
    return await fetchAPI('/admin/users');
  },
};

// Order API functions
export const orderAPI = {
  // Create a new order
  createOrder: async (orderData) => {
    return await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get all orders for authenticated user
  getMyOrders: async () => {
    return await fetchAPI('/orders');
  },

  // Get single order by ID
  getOrderById: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`);
  },

  // Update order (admin only - for updating status)
  updateOrder: async (orderId, updateData) => {
    return await fetchAPI(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    return await fetchAPI(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  },

  // Get all orders (admin only)
  getAllOrders: async () => {
    return await fetchAPI('/orders/admin/orders');
  },
};

export default authAPI;
