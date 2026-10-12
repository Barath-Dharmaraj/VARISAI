import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

/**
 * Guards routes that require citizen password login, but NOT yet OTP verification
 * (such as Language selection and the OTP verification page itself).
 */
export const CitizenAuthOnlyRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { citizenUser } = useAppStore();
  const location = useLocation();

  if (!citizenUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

/**
 * Guards full citizen queue booking routes (Offices, Services, Priority, Token).
 * Requires BOTH password authentication AND 4-digit email OTP verification.
 */
export const CitizenProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { citizenUser, isOtpVerified } = useAppStore();
  const location = useLocation();

  if (!citizenUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isOtpVerified) {
    return <Navigate to="/otp" state={{ from: location.pathname }} replace />;
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
