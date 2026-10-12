import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * Guards Citizen-facing routes.
 * If user is not authenticated and OTP-verified in the active session,
 * redirects them directly to the Login Page /login.
 */
export const CitizenProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { citizenUser, isOtpVerified } = useAppStore();
  const location = useLocation();

  if (!citizenUser || !isOtpVerified) {
    // Preserve the intended target URL for post-login redirect
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

/**
 * Guards Staff / Admin-facing routes.
 * If staff member has not verified their authorization code in the active session,
 * redirects them directly to the Staff Login Portal /login?type=staff.
 */
export const StaffProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { staffUser, isStaffVerified } = useAppStore();
  const location = useLocation();

  if (!staffUser || !isStaffVerified) {
    return <Navigate to="/login?type=staff" state={{ from: location.pathname }} replace />;
  }

  return children;
};
