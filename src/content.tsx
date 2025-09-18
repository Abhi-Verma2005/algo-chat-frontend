import './index.css'
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import ContentPage from '@/content/content'
import { ThemeProvider } from '@/providers/theme'
import { SidebarProvider } from '@/context/SidebarProvider'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthProvider'

const CONTAINER_ID = '__leetcode_ai_whisper_container'

function mount() {
  if (document.getElementById(CONTAINER_ID)) return

  const rootEl = document.createElement('div')
  rootEl.id = CONTAINER_ID
  document.body.append(rootEl)

  const root = createRoot(rootEl)
  root.render(
    <StrictMode>
      <AuthProvider>
        <SidebarProvider>
          <ThemeProvider>
            <div className="h-full w-full">
              <ContentPage />
            </div>
            <Toaster position="top-center" />
          </ThemeProvider>
        </SidebarProvider>
      </AuthProvider>
    </StrictMode>
  )
}

// Delay mounting until document.body is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
