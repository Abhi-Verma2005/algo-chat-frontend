import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './providers/theme.tsx'
import { SidebarProvider } from './context/SidebarProvider.tsx'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthProvider.tsx'
import AuthGuard from './context/AuthGuard.tsx'
import { HashRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <SidebarProvider> 
    <ThemeProvider>
      <HashRouter>
        <div className="h-full w-full pt-14">
          <AuthGuard>
          <App />
          </AuthGuard>
        </div>
        <Toaster position="top-center" />
      </HashRouter>
    </ThemeProvider>
    </SidebarProvider>
    </AuthProvider>
)
