// src/pages/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Check, ArrowLeft } from 'lucide-react';
import LogoComponent from '@/components/common/LogoComponent';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate email
    if (!email.trim()) {
      setError('Inserisci la tua email');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request failed:', err);
      setError(
        err.response?.data?.detail || 
        'Impossibile inviare la richiesta. Riprova più tardi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <LogoComponent size="medium" mode="full" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recupera la tua password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Inserisci la tua email e ti invieremo le istruzioni per reimpostare la password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!success ? (
            <>
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700