// components/custom/sidebar.tsx (updated for cohesive layout)
"use client";

import React, { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarProvider";
import { useAuth } from "@/context/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, MessageSquare, Plus, Clock, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { generateUUID } from "@/lib/utils";

interface ChatHistoryItem {
  id: string;
  createdAt: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  externalUserId: string;
  userEmail?: string;
}

export function Sidebar() {
  const { isOpen, content, sidebarWidth, closeSidebar, setSidebarContent } = useSidebar();
  const { logout, user } = useAuth();
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToolContent, setShowToolContent] = useState(false);

  const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';

  // Show tool content when content is set
  useEffect(() => {
    if (content) {
      setShowToolContent(true);
    } else {
      setShowToolContent(false);
    }
  }, [content]);

  const fetchChatHistory = async () => {
    if (!user) {
      return;
    }
    
    setIsLoading(true);
    try {
      const stored = await chrome.storage.local.get(['token']);
      const token = stored.token;
      
      if (!token) {
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.chats) {
          // Ensure chats is an array and filter out invalid entries
          const validChats = Array.isArray(data.data.chats) 
            ? data.data.chats.filter((chat: any) => {
                const isValid = chat && 
                  chat.id && 
                  chat.messages && 
                  Array.isArray(chat.messages) &&
                  chat.createdAt;
                
                
                return isValid;
              })
            : [];
          
          setChats(validChats);
        } else {
          setChats([]);
        }
      } else {
        console.error('Failed to fetch chat history:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        toast.error('Failed to load chat history');
        setChats([]);
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error('Failed to load chat history');
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!user) return;
    
    try {
      const stored = await chrome.storage.local.get(['token']);
      const token = stored.token;
      
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setChats(chats.filter(chat => chat.id !== chatId));
        toast.success('Chat deleted successfully');
      } else {
        toast.error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const startNewChat = () => {
    // Dispatch custom event to start new chat
    window.dispatchEvent(new CustomEvent('newChat'));
    closeSidebar();
  };

  const loadChat = (chatId: string) => {
    // Dispatch custom event to load specific chat
    window.dispatchEvent(new CustomEvent('loadChat', { detail: { chatId } }));
    closeSidebar();
  };

  const getChatPreview = (messages: Array<{ role: string; content: string }>) => {
    try {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return 'No messages';
      }
      
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || typeof lastMessage !== 'object') {
        return 'Invalid message format';
      }
      
      if (!lastMessage.content || typeof lastMessage.content !== 'string') {
        return 'No message content';
      }
      
      return lastMessage.content.length > 50 
        ? lastMessage.content.substring(0, 50) + '...'
        : lastMessage.content;
    } catch (error) {
      console.error('Error in getChatPreview:', error, messages);
      return 'Error loading preview';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleBackToChats = () => {
    setShowToolContent(false);
    setSidebarContent(null);
  };

  useEffect(() => {
    if (isOpen && user && !showToolContent) {
      fetchChatHistory();
    }
  }, [isOpen, user, showToolContent]);

  // Listen for chat saved events to refresh history
  useEffect(() => {
    const handleChatSaved = () => {
      if (!showToolContent) {
        fetchChatHistory();
      }
    };

    window.addEventListener('chatSaved', handleChatSaved);
    return () => window.removeEventListener('chatSaved', handleChatSaved);
  }, [showToolContent]);

  const handleLogout = async () => {
    await logout();
    closeSidebar();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-0 top-0 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-lg z-50 sidebar-container"
            style={{ width: `${sidebarWidth}px` }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                {showToolContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToChats}
                    className="p-1 mr-2"
                    title="Back to chats"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                )}
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {showToolContent ? 'Tool Result' : 'Chat History'}
                </h2>
                {user && !showToolContent && (
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {user.username || user.email}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!showToolContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </Button>
                )}
                <button
                  onClick={closeSidebar}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {showToolContent ? (
                // Tool Content Display
                <div className="h-full overflow-y-auto p-4">
                  {content}
                </div>
              ) : (
                // Chat History Display
                <>
                  {/* Debug Info */}
                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs mx-4">
                    <div className="font-semibold mb-2">Debug Info:</div>
                    <div>User: {user ? 'Authenticated' : 'Not authenticated'}</div>
                    <div>Chats loaded: {chats.length}</div>
                    <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
                    <div>Sidebar open: {isOpen ? 'Yes' : 'No'}</div>
                  </div>

                  {/* New Chat Button */}
                  <div className="mb-6 px-4">
                    <Button
                      onClick={startNewChat}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Start New Chat
                    </Button>
                  </div>

                  {/* Chat History */}
                  <div className="sidebar-content">
                    <div className="flex items-center justify-between mb-3 px-4">
                      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Recent Chats {chats.length > 0 && `(${chats.length})`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const stored = await chrome.storage.local.get(['token']);
                              const token = stored.token;
                              if (token) {
                                await fetch(`${API_BASE_URL}/chat/debug`, {
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                              }
                            } catch (error) {
                              console.error('Debug endpoint error:', error);
                            }
                          }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                          title="Debug Data"
                        >
                          🐛
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchChatHistory}
                          disabled={isLoading}
                          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                          title="Refresh History"
                        >
                          <div className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
                            ⟳
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Scrollable chat list container */}
                    <div className="sidebar-scrollable custom-scrollbar px-4 pb-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      ) : !chats || chats.length === 0 ? (
                        <div className="text-center p-4 text-zinc-500 dark:text-zinc-400">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No chat history yet</p>
                          <p className="text-xs">Start a conversation to see it here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chats
                            .filter(chat => chat && chat.messages && Array.isArray(chat.messages))
                            .map((chat) => {
                              try {
                                return (
                                  <div
                                    key={chat.id}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => chat.id && loadChat(chat.id)}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <MessageSquare className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          Chat {chat.id && typeof chat.id === 'string' ? chat.id.substring(0, 8) : 'Unknown'}
                                        </span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (chat.id) {
                                            deleteChat(chat.id);
                                          }
                                        }}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete chat"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                      {getChatPreview(chat.messages)}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(chat.createdAt)}
                                      </div>
                                      <span className="text-xs">
                                        {chat.messages && Array.isArray(chat.messages) ? chat.messages.length : 0} messages
                                      </span>
                                    </div>
                                  </div>
                                );
                              } catch (error) {
                                console.error('Error rendering chat item:', error, chat);
                                return (
                                  <div key={chat.id} className="p-3 text-red-500 text-sm">
                                    Error rendering chat
                                  </div>
                                );
                              }
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}