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

// Sell Medicine API functions
export const sellAPI = {
  // Get all active listings with filters
  getAllListings: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.medicineType) queryParams.append('medicineType', filters.medicineType);
    if (filters.priceMin) queryParams.append('priceMin', filters.priceMin);
    if (filters.priceMax) queryParams.append('priceMax', filters.priceMax);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);

    const endpoint = `/sell${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch listings');
    }
    
    return data;
  },

  // Search listings
  searchListings: async (query, page = 1, limit = 12) => {
    const response = await fetch(
      `${API_BASE_URL}/sell/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Search failed');
    }
    
    return data;
  },

  // Get single listing by ID
  getListingById: async (listingId) => {
    return await fetchAPI(`/sell/${listingId}`);
  },

  // Create new listing with image upload
  createListing: async (formData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/sell`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData, // FormData is multipart, don't stringify
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create listing');
    }
    
    return data;
  },

  // Get user's listings
  getMyListings: async (status = '', page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    if (status) queryParams.append('status', status);

    return await fetchAPI(`/sell/user/my-listings?${queryParams.toString()}`);
  },

  // Update listing with optional image upload
  updateListing: async (listingId, formData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/sell/${listingId}`, {
      method: 'PUT',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update listing');
    }
    
    return data;
  },

  // Delete listing
  deleteListing: async (listingId) => {
    return await fetchAPI(`/sell/${listingId}`, {
      method: 'DELETE',
    });
  },

  // Mark quantity as sold
  markAsSold: async (listingId, quantitySold) => {
    return await fetchAPI(`/sell/${listingId}/mark-sold`, {
      method: 'PUT',
      body: JSON.stringify({ quantitySold }),
    });
  },

  // Admin: Get pending listings
  getPendingListings: async (page = 1, limit = 20) => {
    return await fetchAPI(`/sell/admin/pending?page=${page}&limit=${limit}`);
  },

  // Admin: Verify/approve listing
  verifyListing: async (listingId, isVerified, verificationNotes = '') => {
    return await fetchAPI(`/sell/admin/${listingId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ isVerified, verificationNotes }),
    });
  },
};

export default authAPI;
