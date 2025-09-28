import React, { useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { LoginPopup } from '../custom/login-popup'
import { Button } from '../ui/button'

interface AuthProps {
  children: React.ReactNode
  showWelcome?: boolean
}

export const Auth: React.FC<AuthProps> = ({ children, showWelcome = true }) => {
  const { isAuthenticated, loading, handleLoginSuccess } = useAuth()
  const [showLoginPopup, setShowLoginPopup] = useState(false)

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#181A20] text-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-300">
            Checking authentication...
          </h2>
          <p className="text-sm text-gray-400">
            Please wait while we verify your session
          </p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#181A20] text-white">
        {showWelcome && (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Welcome to Algo Chat</h1>
            <p className="text-lg text-gray-300">
              Sign in to start chatting with our AI tutor
            </p>
            <Button onClick={() => setShowLoginPopup(true)} variant="outline">
              Sign In
            </Button>
          </div>
        )}

        <LoginPopup
          isOpen={showLoginPopup}
          onClose={() => setShowLoginPopup(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  // If authenticated, render the children
  return <>{children}</>
}
