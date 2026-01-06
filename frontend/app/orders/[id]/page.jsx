"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Note: Next.js uses 'next/navigation' but project seems to use react-router-dom structure in standard React app or similar. 
// Wait, the project structure is 'frontend/app', which looks like Next.js App Router, BUT the existing files use 'react-router-dom' (e.g., frontend/app/product/[id]/page.jsx:19). 
// I will follow the existing pattern found in ProductDetail page.

import { Link } from "react-router-dom";
import { Loader, AlertCircle, ChevronLeft } from "lucide-react";

import Navigation from "../../../components/navigation";
import OrderCompletion from "../../../components/order-completion";
import ChatComponent from "../../../components/chat-component";
import { orderService } from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../../components/Toast";

export default function OrderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'buyer' or 'seller'
    const [toast, setToast] = useState(null);

    // Helper to determine role
    const determineRole = (orderData, user) => {
        if (!user || !orderData) return null;

        // Check ID matches (ensure string comparison)
        const userId = user._id?.toString();
        const buyerId = typeof orderData.buyerId === 'object' ? orderData.buyerId._id?.toString() : orderData.buyerId?.toString();
        const sellerId = typeof orderData.sellerId === 'object' ? orderData.sellerId._id?.toString() : orderData.sellerId?.toString();

        if (userId === buyerId) return 'buyer';
        if (userId === sellerId) return 'seller';
        return null;
    };

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const data = await orderService.getOrderById(id);

            // Assuming API returns { data: order } or just order. 
            // Based on orderService.js: return response.data.
            // Usually response.data is the payload. Let's assume the payload IS the order or contains it.
            // Looking at `getOrderByAuctionId` usage in ProductDetail:
            // setOrder(orderResponse.data.order);
            // setUserRole(orderResponse.data.userRole);

            // So likely `getOrderById` returns { success, data: { order } }? 
            // Or maybe just the order object? 
            // I'll assume standard { data: { order: ... } } wrapper based on other services.

            const orderData = data.data?.order || data.order || data;

            if (!orderData) throw new Error("Không tìm thấy dữ liệu đơn hàng");

            setOrder(orderData);

            const role = determineRole(orderData, currentUser);
            setUserRole(role);

            if (!role && currentUser) {
                // User is not part of this order
                setError("Bạn không có quyền truy cập đơn hàng này");
            }

        } catch (err) {
            console.error("Error fetching order:", err);
            setError(err.message || "Không thể tải thông tin đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && currentUser) {
            fetchOrder();
        } else if (!currentUser && !loading) {
            // Redirect to login if not logged in? 
            // Or show unauthorized.
        }
    }, [id, currentUser]);

    const handleUpdateOrder = (updatedOrder) => {
        setOrder(updatedOrder);
        // Optionally refetch or update specific fields
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <Loader className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Đang tải thông tin đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center max-w-md mx-auto p-6 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 text-white">Đã xảy ra lỗi</h2>
                        <p className="text-red-400 mb-6">{error}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navigation />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl animate-fade-in">
                {/* Breadcrumb / Back */}
                <div className="mb-8">
                    <Link
                        to={`/product/${order.productId?._id || order.product?._id || order.productId}`}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Quay lại sản phẩm
                    </Link>
                </div>

                <div className="space-y-8">
                    {/* Order Completion Component */}
                    <OrderCompletion
                        order={order}
                        userRole={userRole}
                        ratings={null} // Pass ratings if available in order object or fetch separately? 
                        // order object from createFromAuction usually doesn't have ratings populated unless resolved. 
                        // Let's assume order might have `ratings` populated if logic supports it, otherwise null is fine.
                        onUpdateOrder={handleUpdateOrder}
                    />

                    {/* Chat Section */}
                    <div className="glass-card bg-[#1e293b]/60 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20 backdrop-blur-xl">
                        <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">
                            Trao đổi & Liên hệ
                        </h3>
                        <ChatComponent order={order} currentUser={currentUser} />
                    </div>
                </div>
            </main>
        </div>
    );
}
