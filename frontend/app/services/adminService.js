import api from "./api";


const getAllUsers = () => {
  return api.get("/admin/users");
};

const getUpgradeRequests = () => {
  return api.get("/admin/upgrade-requests");
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
    approveUpgradeRequest,
    rejectUpgradeRequest,
    deleteUser,
    getAutoExtendSettings,
    updateAutoExtendSettings,
};