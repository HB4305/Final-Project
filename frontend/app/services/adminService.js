import api from "./api";

const getAllUsers = (page = 1, limit = 5, search = "") => {
  return api.get(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
};

const getUpgradeRequests = (page = 1, limit = 5) => {
  return api.get(`/admin/upgrade-requests?page=${page}&limit=${limit}`);
};

const getCategories = (params = {}) => {
  const { page = 1, limit = 10, tree = false } = params;
  return api.get(`/admin/categories?page=${page}&limit=${limit}&tree=${tree}`);
};

const getAuctions = (page = 1, limit = 10, status = "") => {
  let url = `/admin/auctions?page=${page}&limit=${limit}`;
  if (status) url += `&status=${status}`;
  return api.get(url);
};

const getStatistics = () => {
  return api.get("/admin/statistics");
};

const approveUpgradeRequest = (requestId) => {
  return api.put(`/admin/upgrade-requests/${requestId}/approve`);
};

const rejectUpgradeRequest = (requestId, reason) => {
  return api.put(`/admin/upgrade-requests/${requestId}/reject`, { reason });
};

const deleteUser = (userId) => {
  return api.delete(`/admin/users/${userId}`);
};

const getAutoExtendSettings = () => {
  return api.get("/admin/settings/auto-extend");
};

const updateAutoExtendSettings = (settings) => {
  return api.put("/admin/settings/auto-extend", settings);
};

export default {
  getAllUsers,
  getUpgradeRequests,
  getCategories,
  getAuctions,
  getStatistics,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  deleteUser,
  getAutoExtendSettings,
  updateAutoExtendSettings,
};