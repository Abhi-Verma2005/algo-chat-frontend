import React, { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // Keep the logic available for use elsewhere
  useAuth();
  return <>{children}</>;
};

export default AuthGuard;