"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '../ui/button';
import { MessageSquare, Clock, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '@/lib/utils';

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

export const ChatHistory: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';

  const fetchChatHistory = async () => {
    if (!user?.token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.chats) {
          setChats(data.data.chats);
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!user?.token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
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

  const getChatPreview = (messages: Array<{ role: string; content: string }>) => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      return lastMessage.content.length > 50 
        ? lastMessage.content.substring(0, 50) + '...'
        : lastMessage.content;
    }
    return 'No messages';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [user?.token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No chat history
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start a new conversation to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chat History
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            New Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChatHistory}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Chat {chat.id.substring(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteChat(chat.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {getChatPreview(chat.messages)}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(chat.createdAt)}
              </div>
              <span className="text-xs">
                {chat.messages.length} messages
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
