import React from 'react';
import { Navigate } from 'react-router-dom';

// This page is deprecated and now redirects to the new multi-step registration flow.
const RegisterPage = () => {
  return <Navigate to="/register" replace />;
};

export default RegisterPage;