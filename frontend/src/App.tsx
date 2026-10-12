import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguagePage } from './pages/LanguagePage';
import { LoginPage } from './pages/LoginPage';
import { OtpPage } from './pages/OtpPage';
import { OfficesPage } from './pages/OfficesPage';
import { ServicesPage } from './pages/ServicesPage';
import { PriorityPage } from './pages/PriorityPage';
import { TokenPage } from './pages/TokenPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { LiveQueuePage } from './pages/LiveQueuePage';
import { PrintPage } from './pages/PrintPage';
import { AdminPage } from './pages/AdminPage';
import { TokenVerifyPage } from './pages/TokenVerifyPage';
import { CitizenAuthOnlyRoute, CitizenProtectedRoute, StaffProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* First Page: Always opens the Login Portal directly at root / */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/staff-login" element={<Navigate to="/login?type=staff" replace />} />
        <Route path="/login-type" element={<Navigate to="/login" replace />} />

        {/* Public Mobile QR Verification Slip (Scanned by smartphone cameras) */}
        <Route path="/token-verify" element={<TokenVerifyPage />} />

        {/* Citizen Language Selection - Requires Citizen Account Login */}
        <Route
          path="/language"
          element={
            <CitizenAuthOnlyRoute>
              <LanguagePage />
            </CitizenAuthOnlyRoute>
          }
        />

        {/* Citizen Email OTP Verification - Required before Office & Token Selection */}
        <Route
          path="/otp"
          element={
            <CitizenAuthOnlyRoute>
              <OtpPage />
            </CitizenAuthOnlyRoute>
          }
        />
        <Route
          path="/offices"
          element={
            <CitizenProtectedRoute>
              <OfficesPage />
            </CitizenProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <CitizenProtectedRoute>
              <ServicesPage />
            </CitizenProtectedRoute>
          }
        />
        <Route
          path="/priority"
          element={
            <CitizenProtectedRoute>
              <PriorityPage />
            </CitizenProtectedRoute>
          }
        />
        <Route
          path="/token"
          element={
            <CitizenProtectedRoute>
              <TokenPage />
            </CitizenProtectedRoute>
          }
        />
        <Route
          path="/booking"
          element={
            <CitizenProtectedRoute>
              <BookingConfirmationPage />
            </CitizenProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <CitizenProtectedRoute>
              <LiveQueuePage />
            </CitizenProtectedRoute>
          }
        />
        <Route
          path="/print"
          element={
            <CitizenProtectedRoute>
              <PrintPage />
            </CitizenProtectedRoute>
          }
        />

        {/* Protected Staff Route - Locked until Staff Login & Verification */}
        <Route
          path="/admin"
          element={
            <StaffProtectedRoute>
              <AdminPage />
            </StaffProtectedRoute>
          }
        />

        {/* Catch-all redirect to first page / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
