// chat.tsx (updated with manual scroll control)
"use client";

import { useSidebar } from "@/context/SidebarProvider";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { Attachment, Message } from "ai";
import { useChat } from "ai/react";
import { useAuth } from "@/context/AuthProvider";
import { LoginPopup } from "./custom/login-popup";
import { Button } from "./ui/button";

// Backend API base for chat streaming
const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';
import { useState, useRef, useEffect } from "react";
import { Overview } from "./custom/overview";
import { Message as PreviewMessage } from "./custom/message";
import { SearchLoader } from "./custom/search-loader";
import { ArrowDown, GripVertical } from "lucide-react";
import { MultimodalInput } from "./custom/multimodal-input";
import { Sidebar } from "./custom/sidebar";
import { generateUUID } from "@/lib/utils";
import { toast } from "sonner";

function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Array<Message>;
}) {
  const { isAuthenticated, user, handleLoginSuccess } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [chatId, setChatId] = useState(id || generateUUID());
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSavingChat, setIsSavingChat] = useState(false);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);

  // Save current chat to database
  const saveCurrentChat = async () => {
    if (!user || messages.length === 0) return;
    
    setIsSavingChat(true);
    try {
      const stored = await chrome.storage.local.get(['token']);
      const token = stored.token;
      
      if (!token) return;
      
      await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            id: msg.id,
          })),
        }),
      });
      
      // Dispatch event to notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('chatSaved'));
      
    } catch (error) {
      console.error('Failed to save chat:', error);
      toast.error('Failed to save chat');
    } finally {
      setIsSavingChat(false);
    }
  };

  // Validate and format messages for rendering
  const validateMessage = (message: any, index: number) => {
    if (!message || typeof message !== 'object') {
      
      return null;
    }

    const content = typeof message.content === 'string' ? message.content : '';
    // Drop messages with no visible content and no tool invocations
    if (!content.trim() && (!message.toolInvocations || message.toolInvocations.length === 0)) {
      return null;
    }

    const validMessage = {
      id: message.id || `msg-${index}`,
      role: message.role || 'user',
      content,
      toolInvocations: message.toolInvocations || [],
      createdAt: message.createdAt || new Date()
    };

    // Log any missing or invalid fields
    

    return validMessage;
  };

  // Load existing chat from database
  const loadExistingChat = async (chatIdToLoad: string) => {
    if (!user) return;
    
    setIsLoadingChat(true);
    try {
      const stored = await chrome.storage.local.get(['token']);
      const token = stored.token;
      
      if (!token) return;
      
      
      
      const response = await fetch(`${API_BASE_URL}/chat/${chatIdToLoad}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        
        if (data.success && data.data?.chat?.messages) {
          
          
          // Ensure messages have proper structure for useChat
          const formattedMessages = data.data.chat.messages
            .map((msg: any, index: number) => ({
              id: msg.id || `msg-${index}`,
              role: msg.role || 'user',
              content: typeof msg.content === 'string' ? msg.content : '',
              toolInvocations: Array.isArray(msg.toolInvocations) ? msg.toolInvocations : [],
              createdAt: msg.createdAt || new Date()
            }))
            // Filter out empty placeholder messages with no content and no tool results
            .filter((m: any) => (m.content?.trim()?.length || 0) > 0 || (m.toolInvocations?.length || 0) > 0);
          
          
          setMessages(formattedMessages);
          setChatId(chatIdToLoad);
          toast.success('Chat loaded successfully');
        } else {
          console.error('Invalid chat data structure:', data);
          toast.error('Failed to load chat: Invalid data structure');
        }
      } else {
        console.error('Failed to load chat:', response.status, response.statusText);
        toast.error('Failed to load chat');
      }
    } catch (error) {
      console.error('Failed to load existing chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Reset chat state for new chat
  const resetChatState = () => {
    
    setMessages([]);
    setInput('');
    setAttachments([]);
    setIsLoadingChat(false);
    setIsSavingChat(false);
    setIsCreatingNewChat(false);
  };

  // Listen for new chat event
  useEffect(() => {
    const handleNewChat = async () => {
      
      
      setIsCreatingNewChat(true);
      
      // Save current chat before starting new one (only if there are messages)
      if (messages.length > 0) {
        
        await saveCurrentChat();
      }
      
      // Generate new chat ID and reset state
      const newId = generateUUID();
      
      
      // Reset all chat-related state
      setChatId(newId);
      resetChatState();
      
      // Force a small delay to ensure state updates before useChat reinitializes
      setTimeout(() => {
        
        setIsCreatingNewChat(false);
      }, 100);
    };

    const handleLoadChat = (event: CustomEvent) => {
      const { chatId: chatIdToLoad } = event.detail;
      if (chatIdToLoad && chatIdToLoad !== chatId) {
        
        loadExistingChat(chatIdToLoad);
      }
    };

    window.addEventListener('newChat', handleNewChat);
    window.addEventListener('loadChat', handleLoadChat as EventListener);
    
    return () => {
      window.removeEventListener('newChat', handleNewChat);
      window.removeEventListener('loadChat', handleLoadChat as EventListener);
    };
  }, [chatId, messages, user]);

  // Load existing chat if ID is provided and different from current
  useEffect(() => {
    if (id && id !== chatId && initialMessages.length === 0) {
      loadExistingChat(id);
    }
  }, [id, chatId, initialMessages.length]);

  const { messages: chatMessages, handleSubmit, input, setInput, append, isLoading, stop } =
    useChat({
      id: chatId,
      api: `${API_BASE_URL}/chat/stream`,
      body: { id: chatId },
      initialMessages: messages,
      maxSteps: 10,
      // Stable key prevents unintended re-initializations that can drop responses
      key: `${chatId}-${messages.length}`,
      fetch: async (url, options) => {
        const stored = await chrome.storage.local.get(['token']);
        const token = stored.token;
        
        if (token && options) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
        
        return fetch(url, options);
      },
      onFinish: async (message) => {
        
        // Chat is automatically saved by the backend in the onFinish handler
        // Update local messages state
        setMessages(prev => [...prev, message]);
        
        // Dispatch event to notify sidebar to refresh
        window.dispatchEvent(new CustomEvent('chatSaved'));
        
      },
    });

  // Update local messages when chat messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      
      // Only update local messages if we're not in the middle of creating a new chat
      if (chatMessages.length > messages.length || messages.length === 0) {
        setMessages(chatMessages);
      }
    }
  }, [chatMessages, messages.length]);

  // Force useChat to update when local messages change (for loaded chats)
  useEffect(() => {
    if (messages.length > 0 && chatMessages.length === 0) {
      
      // This will trigger useChat to use the new initialMessages
    }
  }, [messages, chatMessages.length]);

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { isOpen, sidebarWidth, setSidebarWidth } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newSidebarWidth = containerRect.right - e.clientX;
      
      // Constrain width between 300px and 600px
      if (newSidebarWidth >= 300 && newSidebarWidth <= 600) {
        setSidebarWidth(newSidebarWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setSidebarWidth]);

  // Manual scroll control
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShowScrollButton(!atBottom);
      setShouldAutoScroll(atBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messagesContainerRef]);

  // Auto-scroll only when new messages are added (not during streaming)
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, shouldAutoScroll]); // Only trigger on message count change, not content changes
  
  // Search functionality
  const handleSearch = async (query: string) => {
    
    setIsSearching(true);
    try {
      
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      
      
      if (response.ok) {
        const results = await response.json();
        
        
        // Format results for the AI
        const searchResults = results.map((r: any, i: number) => 
          `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.link}`
        ).join('\n\n');
        
        append({ 
          role: 'user', 
          content: `Search results for "${query}":\n\n${searchResults}\n\nPlease provide a summary of these results.` 
        });
      } else {
        
        append({ 
          role: 'user', 
          content: `Search failed for "${query}". Please try a different search term.` 
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      append({ 
        role: 'user', 
        content: `Search failed for "${query}". Please try again later.` 
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Show login popup if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#181A20] text-white">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to Algo Chat</h1>
          <p className="text-lg text-gray-300">
            Sign in to start chatting with our AI tutor
          </p>
          <Button 
            onClick={() => setShowLoginPopup(true)}
            className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
        
        <LoginPopup
          isOpen={showLoginPopup}
          onClose={() => setShowLoginPopup(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-row h-[calc(100vh-3.5rem)] bg-[#181A20] relative"
    >
      {/* Main Chat Area */}
      <div 
        className={`flex flex-col justify-center pb-4 md:pb-8 transition-all duration-300 ${
          isOpen ? 'flex-1' : 'w-full'
        }`}
        style={{
          minWidth: isOpen ? '300px' : '100%',
          maxWidth: isOpen ? `calc(100% - ${sidebarWidth}px)` : '100%'
        }}
      >
        <div className="flex flex-col justify-between items-center gap-4 h-full">
          <div
            ref={messagesContainerRef}
            className="flex flex-col gap-4 h-full w-full items-center overflow-y-auto px-4 md:px-0"
          >
            {isLoadingChat || isSavingChat || isCreatingNewChat ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">
                  {isLoadingChat ? "Loading chat..." : 
                   isSavingChat ? "Saving chat..." : 
                   "Creating new chat..."}
                </span>
              </div>
            ) : chatMessages.length === 0 && messages.length === 0 ? (
              <Overview />
            ) : (
              <>
                {/* Debug info */}
                <div className="text-xs text-gray-500 mb-2">
                  Debug: {chatMessages.length} messages, Chat ID: {chatId}
                </div>
                
                {chatMessages
                  .map((message, idx) => validateMessage(message, idx))
                  .filter((message): message is NonNullable<ReturnType<typeof validateMessage>> => message !== null)
                  .map((message, idx) => {
                    
                    return (
                      <PreviewMessage
                        key={message.id || `msg-${idx}`}
                        role={message.role}
                        content={message.content}
                        toolInvocations={message.toolInvocations}
                        append={append}
                        isStreaming={
                          message.role === 'assistant' &&
                          isLoading &&
                          idx === chatMessages.length - 1
                        }
                      />
                    );
                  })}
              </>
            )}
            
            {/* Show shimmer as soon as user sends a message */}
            {isLoading && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user' && (
              <PreviewMessage
                key="thinking-shimmer"
                role="assistant"
                content={''}
                toolInvocations={[]}
                isStreaming={true}
              />
            )}
            
            {/* Show search loader when searching */}
            {isSearching && (
              <div className="w-full max-w-2xl">
                <SearchLoader />
              </div>
            )}

            <div
              ref={messagesEndRef}
              className="shrink-0 min-w-[24px] min-h-[24px]"
            />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              className="fixed bottom-24 right-8 z-30 bg-fuchsia-700 hover:bg-fuchsia-600 text-white p-2 rounded-full shadow-lg transition"
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setShouldAutoScroll(true);
              }}
            >
              <ArrowDown className="size-5" />
            </button>
          )}

          <form className="flex flex-row gap-2 relative items-end w-full md:max-w-[500px] max-w-[calc(100dvw-32px)] px-4 md:px-0">
            <MultimodalInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={chatMessages}
              append={append}
              onSearch={handleSearch}
            />
          </form>
        </div>
      </div>

      {/* Resize Handle - only show when sidebar is open */}
      {isOpen && (
        <div
          className="w-1 bg-border hover:bg-blue-500/50 cursor-col-resize transition-colors relative z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar />
    </div>
  );
}

export default Chat;