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

export default {
    getAllUsers,
    getUpgradeRequests,
    approveUpgradeRequest,
    rejectUpgradeRequest,
};