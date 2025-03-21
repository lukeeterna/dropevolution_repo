// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import api from '../api/config';

// Crea il contesto di autenticazione
const AuthContext = createContext(null);

// Hook personalizzato per usare il contesto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verifica se l'utente è già autenticato all'avvio dell'app
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        // Ottieni il token dal localStorage
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        // Configura le chiamate con il token di autenticazione
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verifica validità del token
        const response = await api.get('/users/me');
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Errore verifica autenticazione:', err);
        // In caso di errore, pulisci il token e l'utente corrente
        localStorage.removeItem('accessToken');
        delete api.defaults.headers.common['Authorization'];
        setCurrentUser(null);
        setError('Sessione scaduta. Effettua nuovamente il login.');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Funzione di login
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      const { access_token, user } = response.data;
      
      // Salva il token nel localStorage
      localStorage.setItem('accessToken', access_token);
      
      // Imposta il token per le future chiamate API
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Errore login:', err);
      
      if (err.response) {
        // Errore di risposta dal server
        if (err.response.status === 401) {
          setError('Credenziali non valide. Controlla email e password.');
        } else {
          setError(err.response.data.detail || 'Errore durante il login. Riprova più tardi.');
        }
      } else if (err.request) {
        // Errore di rete
        setError('Impossibile raggiungere il server. Verifica la tua connessione.');
      } else {
        setError('Si è verificato un errore durante il login. Riprova più tardi.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funzione di registrazione
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      
      return response.data;
    } catch (err) {
      console.error('Errore registrazione:', err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError(err.response.data.detail || 'Dati di registrazione non validi.');
        } else if (err.response.status === 409) {
          setError('Email già in uso. Prova con un\'altra email.');
        } else {
          setError('Errore durante la registrazione. Riprova più tardi.');
        }
      } else if (err.request) {
        setError('Impossibile raggiungere il server. Verifica la tua connessione.');
      } else {
        setError('Si è verificato un errore durante la registrazione. Riprova più tardi.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funzione di logout
  const logout = () => {
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  // Funzione per recupero password
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      console.error('Errore recupero password:', err);
      
      if (err.response) {
        setError(err.response.data.detail || 'Errore durante il recupero della password.');
      } else if (err.request) {
        setError('Impossibile raggiungere il server. Verifica la tua connessione.');
      } else {
        setError('Si è verificato un errore durante il recupero della password.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funzione per reset password
  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/reset-password', {
        token,
        password
      });
      
      return response.data;
    } catch (err) {
      console.error('Errore reset password:', err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError('Token non valido o scaduto.');
        } else {
          setError(err.response.data.detail || 'Errore durante il reset della password.');
        }
      } else if (err.request) {
        setError('Impossibile raggiungere il server. Verifica la tua connessione.');
      } else {
        setError('Si è verificato un errore durante il reset della password.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funzione per aggiornare il profilo utente
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/users/me', userData);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Errore aggiornamento profilo:', err);
      
      if (err.response) {
        setError(err.response.data.detail || 'Errore durante l\'aggiornamento del profilo.');
      } else if (err.request) {
        setError('Impossibile raggiungere il server. Verifica la tua connessione.');
      } else {
        setError('Si è verificato un errore durante l\'aggiornamento del profilo.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funzione per cambiare la password
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      
      return response.data;
    } catch (err) {
      console.error('Errore cambio password:', err);
      
      if (err.response) {
        if (err.response.status === 400) {
          setError('La password attuale non è corretta.');
        } else {
          setError(err.response.data.detail || 'Errore durante il cambio della password.');
        }
      } else if (err.request) {
        setError('Impossibile raggiungere il server. Verifica la tua connessione.');
      } else {
        setError('Si è verificato un errore durante il cambio della password.');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Valore del contesto
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    setError // Esponiamo questa funzione per permettere di ripulire gli errori
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthContext;
