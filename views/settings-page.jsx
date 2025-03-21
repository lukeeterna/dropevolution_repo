// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Key, 
  Tag, 
  Bell, 
  CreditCard, 
  Save, 
  Check, 
  AlertCircle,
  ExternalLink,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SettingsPage = () => {
  const { currentUser, updateProfile, changePassword, error, setError } = useAuth();
  
  // Stati per diversi form 
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [marketplaceData, setMarketplaceData] = useState({
    ebay_enabled: false,
    ebay_token: '',
    amazon_enabled: false,
    amazon_token: ''
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    price_change_alerts: true,
    inventory_alerts: true,
    order_notifications: true
  });
  
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    marketplace: false,
    notifications: false
  });
  
  const [success, setSuccess] = useState({
    profile: false,
    password: false,
    marketplace: false,
    notifications: false
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false
  });
  
  // Carica i dati dell'utente all'avvio
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        company_name: currentUser.company_name || ''
      });
      
      // In un'implementazione reale, questi dati potrebbero essere caricati da API separate
      // Per ora utilizziamo valori di esempio
      setMarketplaceData({
        ebay_enabled: currentUser.ebay_enabled || false,
        ebay_token: currentUser.ebay_token || '',
        amazon_enabled: currentUser.amazon_enabled || false,
        amazon_token: currentUser.amazon_token || ''
      });
      
      setNotificationSettings({
        email_notifications: currentUser.email_notifications !== false,
        price_change_alerts: currentUser.price_change_alerts !== false,
        inventory_alerts: currentUser.inventory_alerts !== false,
        order_notifications: currentUser.order_notifications !== false
      });
    }
  }, [currentUser]);
  
  // Gestisci aggiornamento profilo
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Reset success/error
    setSuccess({ ...success, profile: false });
    setError && setError(null);
    setLoading({ ...loading, profile: true });
    
    try {
      await updateProfile(profileData);
      setSuccess({ ...success, profile: true });
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess({ ...success, profile: false });
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };
  
  // Gestisci cambio password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Reset success/error
    setSuccess({ ...success, password: false });
    setError && setError(null);
    
    // Validazione
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError && setError('Le password non corrispondono');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setError && setError('La nuova password deve essere di almeno 8 caratteri');
      return;
    }
    
    setLoading({ ...loading, password: true });
    
    try {
      await changePassword(passwordData.current_password, passwordData.new_password);
      setSuccess({ ...success, password: true });
      
      // Reset form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess({ ...success, password: false });
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
    } finally {
      setLoading({ ...loading, password: false });
    }
  };
  
  // Gestisci modifica integrazioni marketplace
  const handleMarketplaceSubmit = async (e) => {
    e.preventDefault();
    
    // Reset success/error
    setSuccess({ ...success, marketplace: false });
    setError && setError(null);
    setLoading({ ...loading, marketplace: true });
    
    try {
      // In un'implementazione reale, questi dati verrebbero salvati tramite API
      console.log('Marketplace data:', marketplaceData);
      
      // Simula un'operazione asincrona
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess({ ...success, marketplace: true });
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess({ ...success, marketplace: false });
      }, 3000);
    } catch (err) {
      console.error('Error updating marketplace integrations:', err);
      setError && setError('Errore durante l\'aggiornamento delle integrazioni marketplace');
    } finally {
      setLoading({ ...loading, marketplace: false });
    }
  };
  
  // Gestisci modifica notifiche
  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    
    // Reset success/error
    setSuccess({ ...success, notifications: false });
    setError && setError(null);
    setLoading({ ...loading, notifications: true });
    
    try {
      // In un'implementazione reale, questi dati verrebbero salvati tramite API
      console.log('Notification settings:', notificationSettings);
      
      // Simula un'operazione asincrona
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess({ ...success, notifications: true });
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess({ ...success, notifications: false });
      }, 3000);
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError && setError('Errore durante l\'aggiornamento delle impostazioni di notifica');
    } finally {
      setLoading({ ...loading, notifications: false });
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Settings className="mr-2 h-6 w-6" />
          Impostazioni
        </h1>
        
        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profilo */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profilo
              </h2>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading.profile}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading.profile ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading.profile ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 -ml-1 h-4 w-4" />
                      Salva modifiche
                    </>
                  )}
                </button>
              </div>
              
              {success.profile && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">Profilo aggiornato con successo</p>
                  </div>
                </div>
              )}
            </form>
          </div>
          
          {/* Cambio password */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Cambia Password
              </h2>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                  Password attuale
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="current_password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                  Nuova password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  La password deve essere di almeno 8 caratteri
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Conferma nuova password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading.password}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading.password ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading.password ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 -ml-1 h-4 w-4" />
                      Cambia password
                    </>
                  )}
                </button>
              </div>
              
              {success.password && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">Password aggiornata con successo</p>
                  </div>
                </div>
              )}
            </form>
          </div>
          
          {/* Integrazioni marketplace */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Tag className="mr-2 h-5 w-5" />
                Integrazioni Marketplace
              </h2>
            </div>
            
            <form onSubmit={handleMarketplaceSubmit} className="p-6 space-y-4">
              {/* eBay */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900">eBay</h3>
                    {marketplaceData.ebay_enabled && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Attivo
                      </span>
                    )}
                  </div>
                  
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="ebay_enabled"
                      name="ebay_enabled"
                      checked={marketplaceData.ebay_enabled}
                      onChange={(e) => setMarketplaceData({...marketplaceData, ebay_enabled: e.target.checked})}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label
                      htmlFor="ebay_enabled"
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${marketplaceData.ebay_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>
                
                {marketplaceData.ebay_enabled && (
                  <div className="mt-3">
                    <label htmlFor="ebay_token" className="block text-sm font-medium text-gray-700">
                      Token API eBay
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        id="ebay_token"
                        name="ebay_token"
                        value={marketplaceData.ebay_token}
                        onChange={(e) => setMarketplaceData({...marketplaceData, ebay_token: e.target.value})}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      <a
                        href="https://developer.ebay.com/api-docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        <ExternalLink className="inline h-3 w-3 mr-1" />
                        Come ottenere un token eBay
                      </a>
                    </p>
                  </div>
                )}
              </div>
              
              {/* Amazon */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900">Amazon</h3>
                    {marketplaceData.amazon_enabled && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Attivo
                      </span>
                    )}
                  </div>
                  
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      id="amazon_enabled"
                      name="amazon_enabled"
                      checked={marketplaceData.amazon_enabled}
                      onChange={(e) => setMarketplaceData({...marketplaceData, amazon_enabled: e.target.checked})}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label
                      htmlFor="amazon_enabled"
                      className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${marketplaceData.amazon_enabled ? 'bg-indigo-500' : 'bg-gray-300'}`}
                    ></label>
                  </div>
                </div>
                
                {marketplaceData.amazon_enabled && (
                  <div className="mt-3">
                    <label htmlFor="amazon_token" className="block text-sm font-medium text-gray-700">
                      Token API Amazon
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        id="amazon_token"
                        name="amazon_token"
                        value={marketplaceData.amazon_token}
                        onChange={(e) => setMarketplaceData({...marketplaceData, amazon_token: e.target.value})}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      <a
                        href="https://developer.amazonservices.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        <ExternalLink className="inline h-3 w-3 mr-1" />
                        Come ottenere un token Amazon
                      </a>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading.marketplace}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading.marketplace ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading.marketplace ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 -ml-1 h-4 w-4" />
                      Salva modifiche
                    </>
                  )}
                </button>
              </div>
              
              {success.marketplace && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">Integrazioni aggiornate con successo</p>
                  </div>
                </div>
              )}
            </form>
          </div>
          
          {/* Impostazioni notifiche */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifiche
              </h2>
            </div>
            
            <form onSubmit={handleNotificationsSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="email_notifications"
                    name="email_notifications"
                    type="checkbox"
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, email_notifications: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email_notifications" className="ml-3 text-sm font-medium text-gray-700">
                    Notifiche via email
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="price_change_alerts"
                    name="price_change_alerts"
                    type="checkbox"
                    checked={notificationSettings.price_change_alerts}
                    onChange={(e) => setNotificationSettings({...notificationSettings, price_change_alerts: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="price_change_alerts" className="ml-3 text-sm font-medium text-gray-700">
                    Avvisi di variazione prezzo
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="inventory_alerts"
                    name="inventory_alerts"
                    type="checkbox"
                    checked={notificationSettings.inventory_alerts}
                    onChange={(e) => setNotificationSettings({...notificationSettings, inventory_alerts: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inventory_alerts" className="ml-3 text-sm font-medium text-gray-700">
                    Avvisi di inventario (prodotti esauriti)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="order_notifications"
                    name="order_notifications"
                    type="checkbox"
                    checked={notificationSettings.order_notifications}
                    onChange={(e) => setNotificationSettings({...notificationSettings, order_notifications: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="order_notifications" className="ml-3 text-sm font-medium text-gray-700">
                    Notifiche di nuovi ordini
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading.notifications}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading.notifications ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading.notifications ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 -ml-1 h-4 w-4" />
                      Salva modifiche
                    </>
                  )}
                </button>
              </div>
              
              {success.notifications && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">Impostazioni notifiche aggiornate con successo</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
        
        {/* CSS per i toggle switch */}
        <style jsx>{`
          .toggle-checkbox:checked {
            right: 0;
            border-color: #4F46E5;
          }
          .toggle-checkbox:checked + .toggle-label {
            background-color: #4F46E5;
          }
          .toggle-label {
            transition: background-color 0.2s ease-in;
          }
          .toggle-checkbox {
            transition: all 0.2s ease-in;
          }
        `}</style>
      </div>
    </div>
  );
};

export default SettingsPage;>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Nome azienda
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={profileData.company_name}
                  onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div