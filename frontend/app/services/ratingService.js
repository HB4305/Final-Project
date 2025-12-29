import api from './api';

const ratingService = {
    createRating: async (rateeId, ratingData) => {
        return await api.post(`/ratings/${rateeId}`, ratingData);
    },

    updateRating: async (ratingId, ratingData) => {
        return await api.put(`/ratings/${ratingId}`, ratingData);
    },

    deleteRating: async (ratingId) => {
        return await api.delete(`/ratings/${ratingId}`);
    },

    getUserRatings: async (userId, page = 1, limit = 10, type = 'received') => {
        return await api.get(`/ratings/${userId}`, {
            params: { page, limit, type }
        });
    },

    getUserRatingStats: async (userId) => {
        return await api.get(`/ratings/${userId}/stats`);
    }
};

export default ratingService;
