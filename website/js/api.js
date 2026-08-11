// Base URL for API requests
const API_BASE_URL = "https://chipelec-power-system-production.up.railway.app/api";

// ======================
// AUTH HELPERS
// ======================

function getCustomerToken() {
  return localStorage.getItem('customerToken');
}

function getCustomerData() {
  const data = localStorage.getItem('customerData');
  return data ? JSON.parse(data) : null;
}

function isCustomerLoggedIn() {
  return !!getCustomerToken();
}

function getAuthHeaders() {
  const token = getCustomerToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

function customerLogout() {
  localStorage.removeItem('customerToken');
  localStorage.removeItem('customerData');
  window.location.href = 'login.html';
}

function requireCustomerLogin() {
  if (!isCustomerLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Utility to handle fetch errors
async function handleResponse(response) {
  if (response.status === 401 || response.status === 403) {
    throw new Error("This service requires authentication. Please login to continue.");
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ======================
// CUSTOMER AUTH API
// ======================

const CustomerAuthAPI = {
  register: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error registering:", error);
      throw error;
    }
  },
  login: async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },
  getProfile: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/profile`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },
  updateProfile: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },
  changePassword: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/change-password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },
  getDashboardStats: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/dashboard-stats`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },
  getQuotations: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/quotations`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      throw error;
    }
  }
};

// Product APIs
const ProductAPI = {
  getAllProducts: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },
  getProductById: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`);
      return await handleResponse(res);
    } catch (error) {
      console.error("Error fetching product details:", error);
      throw error;
    }
  }
};

// Installation API
const InstallationAPI = {
  bookInstallation: async (data) => {
    try {
      const customerStr = localStorage.getItem('customer');
      if(customerStr) {
          const customer = JSON.parse(customerStr);
          data.customer_id = customer.id;
      }
      const res = await fetch(`${API_BASE_URL}/installations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error booking installation:", error);
      throw error;
    }
  },
  getInstallations: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/installations`, {
        headers: getAuthHeaders()
      });
      const data = await handleResponse(res);
      const customerStr = localStorage.getItem('customer');
      if (data.success && data.data && customerStr) {
          const customer = JSON.parse(customerStr);
          data.data = data.data.filter(i => i.customer_id === customer.id);
      }
      return data;
    } catch (error) {
      console.error("Error fetching installations:", error);
      throw error;
    }
  }
};

// Service Request API
const ServiceAPI = {
  raiseRequest: async (data) => {
    try {
      const customerStr = localStorage.getItem('customer');
      if(customerStr) {
          const customer = JSON.parse(customerStr);
          data.customer_id = customer.id;
      }
      const res = await fetch(`${API_BASE_URL}/service-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    } catch (error) {
      console.error("Error raising service request:", error);
      throw error;
    }
  },
  getServiceRequests: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/service-requests`, {
        headers: getAuthHeaders()
      });
      const data = await handleResponse(res);
      const customerStr = localStorage.getItem('customer');
      if (data.success && data.data && customerStr) {
          const customer = JSON.parse(customerStr);
          data.data = data.data.filter(s => s.customer_id === customer.id);
      }
      return data;
    } catch (error) {
      console.error("Error fetching service requests:", error);
      throw error;
    }
  }
};

window.api = {
  customerAuth: CustomerAuthAPI,
  products: ProductAPI,
  installations: InstallationAPI,
  services: ServiceAPI
};
