# LeetCode Whisper Chrome Extension

A Chrome extension that provides an AI-powered chat interface for DSA (Data Structures & Algorithms) learning, built with React and Vite.

## Features

### 🤖 AI Chat Interface
- **Gemini AI Integration**: Powered by Google's Gemini Pro model for intelligent DSA tutoring
- **Streaming Responses**: Real-time AI responses with streaming text
- **Tool Integration**: Access to user progress, question recommendations, and web search
- **Multimodal Input**: Support for text, code, and file attachments

### 💬 Chat History Management
- **Persistent Storage**: All chats are automatically saved to the backend database
- **History Sidebar**: Access to all previous conversations with preview snippets
- **New Chat Creation**: Start fresh conversations while preserving previous chats
- **Chat Loading**: Resume any previous conversation by clicking on it
- **Chat Deletion**: Remove unwanted conversations from history

### 🔐 Authentication & Security
- **User Authentication**: Secure login system with JWT tokens
- **Session Management**: Persistent sessions with automatic token refresh
- **User Context**: Personalized AI responses based on user progress and preferences

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly across different screen sizes
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Intuitive Navigation**: Easy access to chat history and new chat creation

## How to Use

### Starting a New Chat
1. Click the "New Chat" button in the navbar
2. The current chat will be automatically saved
3. A fresh conversation will begin

### Accessing Chat History
1. Click the menu icon (☰) in the navbar to open the sidebar
2. View all your previous conversations with preview snippets
3. Click on any chat to resume that conversation
4. Use the delete button to remove unwanted chats

### Chat Features
- **Ask Questions**: Get help with DSA concepts and problems
- **Code Review**: Submit your solutions for AI feedback
- **Progress Tracking**: Monitor your learning journey
- **Web Search**: Get real-time information and latest contest updates

## Technical Architecture

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions

### Backend Integration
- **RESTful API**: Clean API endpoints for chat operations
- **Streaming Support**: Real-time AI response streaming
- **Authentication**: JWT-based secure authentication
- **Database**: Persistent chat storage with user isolation

### State Management
- **React Context**: Global state for authentication and sidebar
- **Local State**: Component-level state management
- **Chrome Storage**: Extension-specific data persistence

## Development

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Chrome browser for testing

### Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Load the Chrome Extension
1. Run `pnpm build` to generate the `dist/` folder.
2. Open Chrome and go to `chrome://extensions`.
3. Enable Developer mode (top-right toggle).
4. Click "Load unpacked" and select the `dist/` folder.
5. You should now see "LeetCode Whisper" installed.

### Open the Chat Box
- Popup: Click the extension icon in the Chrome toolbar; the popup loads `index.html` with the chat UI.
- Side Panel: On any tab, click the gear icon in the on-page widget on LeetCode, or open the side panel via the extension action.
- On-page Widget: Visit any LeetCode problem page (`https://leetcode.com/problems/*`) and click the bot button that appears at the bottom-right to toggle the on-page chat.

If nothing appears on LeetCode pages, make sure the extension has access to `leetcode.com` (click the extension’s Details > Site access) and that you are on a problem page path.

### Environment Variables
Create a `.env` file with:
```env
VITE_BACKEND_API_BASE_URL=http://localhost:3001/api
```

If your backend runs on a different host or port, update the value accordingly. The extension background and UI will use this base.

## Chat History Implementation

The chat history system works as follows:

1. **Automatic Saving**: Every chat is automatically saved when the AI finishes responding
2. **Manual Saving**: Chats are also saved when starting a new conversation
3. **History Retrieval**: All chats are fetched from the backend and displayed in the sidebar
4. **Chat Loading**: Clicking on a chat history item loads that specific conversation
5. **State Management**: Local state is synchronized with backend data for seamless UX

### Key Components

- **Sidebar**: Displays chat history with preview snippets and management options
- **Chat Component**: Handles chat state, saving, and loading operations
- **Event System**: Custom events for new chat creation and chat loading
- **API Integration**: Backend endpoints for CRUD operations on chats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
