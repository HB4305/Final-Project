import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, X } from 'lucide-react';

/**
 * ChatComponent
 * Real-time chat between buyer and seller during order completion (section 7)
 */
export default function ChatComponent({ 
  orderId, 
  currentUserId,
  currentUserName,
  otherUserId,
  otherUserName,
  messages = [],
  onSendMessage 
}) {
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !attachment) return;

    const message = {
      orderId,
      senderId: currentUserId,
      senderName: currentUserName,
      receiverId: otherUserId,
      text: newMessage.trim(),
      attachment: attachment,
      timestamp: new Date().toISOString()
    };

    onSendMessage && onSendMessage(message);
    setNewMessage('');
    setAttachment(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In real app, would upload file and get URL
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
        <div>
          <h3 className="font-semibold">Chat with {otherUserName}</h3>
          <p className="text-xs text-muted-foreground">Order #{orderId}</p>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === currentUserId;
            
            return (
              <div 
                key={index}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isOwnMessage && (
                    <span className="text-xs text-muted-foreground mb-1">{msg.senderName}</span>
                  )}
                  
                  <div className={`rounded-lg p-3 ${
                    isOwnMessage 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                    
                    {msg.attachment && (
                      <div className="mt-2">
                        {msg.attachment.type.startsWith('image/') ? (
                          <img 
                            src={msg.attachment.url} 
                            alt={msg.attachment.name}
                            className="max-w-full rounded"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                            <Paperclip className="w-4 h-4" />
                            <span className="text-xs">{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {attachment && (
        <div className="px-4 py-2 border-t border-border bg-muted/50">
          <div className="flex items-center gap-2 p-2 bg-background rounded">
            {attachment.type.startsWith('image/') ? (
              <>
                <Image className="w-4 h-4 text-primary" />
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="h-12 w-12 object-cover rounded"
                />
              </>
            ) : (
              <Paperclip className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm flex-1">{attachment.name}</span>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted">
        <div className="flex gap-2">
          {/* File Upload Button */}
          <label className="cursor-pointer p-2 hover:bg-background rounded transition">
            <input
              type="file"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
            />
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </label>

          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() && !attachment}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Share order details, shipping info, or any questions here
        </p>
      </form>
    </div>
  );
}
