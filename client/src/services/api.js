// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

export default api;
// This file sets up the Axios instance for API requests in the Travel Planner MVP application, configuring the base URL and enabling credentials for cross-origin requests.