import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useOrderchat } from "../hooks/useOrderchat.js";
import Toast from "./Toast";

/**
 * ChatComponent
 * Real-time chat between buyer and seller during order completion (section 7)
 */
export default function ChatComponent({ order, currentUser }) {
  const orderId = order._id;
  const currentUserId = currentUser._id;
  const currentUserName = currentUser.username || currentUser.fullName;

  // Determine other user
  const isBuyer =
    order.buyerId._id === currentUserId || order.buyerId === currentUserId;
  const otherUser = isBuyer ? order.sellerId : order.buyerId;
  const otherUserId = otherUser?._id || otherUser;
  const otherUserName =
    otherUser?.fullName || otherUser?.username || "Người dùng";

  const { messages, loading, sending, sendMessage } = useOrderchat(orderId);
  const [newMessage, setNewMessage] = useState("");
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);

  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      setToast({
        message: "Gửi tin nhắn thất bại: " + error.message,
        type: "error",
      });
    }
  };



  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-lg">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
        <div>
          <h3 className="font-semibold">Trò chuyện với {otherUserName}</h3>
          <p className="text-xs text-muted-foreground">Đơn hàng #{orderId}</p>
        </div>
        <div
          className="w-2 h-2 bg-green-500 rounded-full"
          title="Trực tuyến"
        ></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            // Check if senderId is populated (object) or raw ID (string)
            const senderId = msg.senderId?._id || msg.senderId;
            const isOwnMessage =
              senderId?.toString() === currentUserId?.toString();
            const senderName =
              msg.senderId?.username || msg.senderId?.fullName || "Người dùng";

            return (
              <div
                key={index}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] ${
                    isOwnMessage ? "items-end" : "items-start"
                  } flex flex-col`}
                >
                  {!isOwnMessage && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {senderName}
                    </span>
                  )}

                  <div
                    className={`rounded-lg p-3 ${
                      isOwnMessage
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.message && (
                      <p className="text-sm break-words">{msg.message}</p>
                    )}


                  </div>

                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>



      {/* Message Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-border bg-muted"
      >
        <div className="flex gap-2">


          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Chia sẻ chi tiết đơn hàng, thông tin vận chuyển hoặc bất kỳ câu hỏi
          nào tại đây
        </p>
      </form>
    </div>
  );
}
