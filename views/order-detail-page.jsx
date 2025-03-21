// src/pages/Orders/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  AlertCircle, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  User, 
  MapPin, 
  Phone,
  Mail,
  DollarSign,
  FileText,
  Printer,
  Download,
  ExternalLink,
  Edit,
  RefreshCw
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getOrder, updateOrderStatus, getOrderTracking, createFulfillment } from '@/api/orders';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [fulfillmentData, setFulfillmentData] = useState({
    tracking_number: '',
    carrier: '',
    notes: ''
  });
  
  // Carica i dati dell'ordine
  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      
      try {
        const [orderData, trackingData] = await Promise.all([
          getOrder(id),
          getOrderTracking(id).catch(() => null) // Se non c'è tracking, ignora l'errore
        ]);
        
        setOrder(orderData);
        setTracking(trackingData);
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('Si è verificato un errore nel caricamento dei dati dell\'ordine.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [id]);
  
  // Gestisci cambio stato ordine
  const handleStatusChange = async () => {
    if (!newStatus) return;
    
    setActionLoading(true);
    
    try {
      const updatedOrder = await updateOrderStatus(id, { status: newStatus });
      setOrder(updatedOrder);
      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Si è verificato un errore durante l\'aggiornamento dello stato dell\'ordine.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Gestisci creazione adempimento
  const handleCreateFulfillment = async (e) => {
    e.preventDefault();
    
    if (!fulfillmentData.tracking_number || !fulfillmentData.carrier) {
      setError('Inserisci il numero di tracking e il corriere.');
      return;
    }
    
    setActionLoading(true);
    
    try {
      const result = await createFulfillment(id, fulfillmentData);
      
      // Aggiorna l'ordine con lo stato aggiornato
      setOrder(prevOrder => ({
        ...prevOrder,
        order_status: 'fulfilled',
        fulfillment: result
      }));
      
      setShowFulfillModal(false);
    } catch (err) {
      console.error('Error creating fulfillment:', err);
      setError('Si è verificato un errore durante la creazione dell\'adempimento.');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Formatta prezzo
  const formatPrice = (price, currency = 'EUR') => {
    if (price === null || price === undefined) return 'N/D';
    
    const formatter = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    });
    
    return formatter.format(price);
  };
  
  // Formatta data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Ottieni informazioni sullo stato dell'ordine
  const getStatusInfo = (status) => {
    switch (status) {
      case 'new':
        return { 
          name: 'Nuovo', 
          icon: AlertCircle, 
          className: 'bg-yellow-100 text-yellow-800',
          borderColor: 'border-yellow-500' 
        };
      case 'processing':
        return { 
          name: 'In lavorazione', 
          icon: Clock, 
          className: 'bg-blue-100 text-blue-800',
          borderColor: 'border-blue-500'
        };
      case 'fulfilled':
        return { 
          name: 'Spedito', 
          icon: Truck, 
          className: 'bg-indigo-100 text-indigo-800',
          borderColor: 'border-indigo-500'
        };
      case 'completed':
        return { 
          name: 'Completato', 
          icon: CheckCircle, 
          className: 'bg-green-100 text-green-800',
          borderColor: 'border-green-500'
        };
      case 'cancelled':
        return { 
          name: 'Annullato', 
          icon: AlertCircle, 
          className: 'bg-red-100 text-red-800',
          borderColor: 'border-red-500'
        };
      default:
        return { 
          name: status || 'Sconosciuto', 
          icon: Package, 
          className: 'bg-gray-100 text-gray-800',
          borderColor: 'border-gray-500'
        };
    }
  };

  if (loading) {
    return <LoadingSpinner text="Caricamento dati ordine..." />;
  }

  if (!order) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Ordine non trovato</h3>
            <p className="mt-1 text-sm text-gray-500">
              L'ordine richiesto non è stato trovato o non è più disponibile.
            </p>
            <div className="mt-6">
              <Link
                to="/orders"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Torna agli ordini
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(order.order_status);
  const StatusIcon = statusInfo.icon;
  
  // Calcola totali
  const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || order.order_total || 0;
  const shippingCost = order.shipping_cost || 0;
  const taxAmount = order.tax_amount || 0;
  const total = subtotal + shippingCost + taxAmount;
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Intestazione */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-5">
            <Link
              to="/orders"
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Indietro
            </Link>
            
            <h1 className="text-2xl font-semibold text-gray-900">
              Ordine #{order.ebay_order_id || order.id.substring(0, 8)}
            </h1>
            
            <span className={`ml-3 px-2.5 py-0.5 rounded-full text-sm font-medium ${statusInfo.className}`}>
              <StatusIcon className="inline-block mr-1 h-4 w-4" />
              {statusInfo.name}
            </span>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Printer className="mr-2 h-4 w-4" />
              Stampa
            </button>
            
            {/* Cambio stato ordine */}
            <button
              onClick={() => {
                setNewStatus(order.order_status);
                setShowStatusModal(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit className="mr-2 h-4 w-4" />
              Cambia stato
            </button>
            
            {/* Pulsante per creare spedizione */}
            {(order.order_status === 'new' || order.order_status === 'processing') && (
              <button
                onClick={() => setShowFulfillModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Truck className="mr-2 h-4 w-4" />
                Spedisci ora
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Contenuto principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna sinistra - Dettagli ordine */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stato ordine */}
            <div className={`bg-white shadow rounded-lg p-6 border-t-4 ${statusInfo.borderColor}`}>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Stato Ordine
              </h2>
              
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-between">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${order.order_status === 'new' || order.order_status === 'processing' || order.order_status === 'fulfilled' || order.order_status === 'completed' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <AlertCircle className={`h-5 w-5 ${order.order_status === 'new' || order.order_status === 'processing' || order.order_status === 'fulfilled' || order.order_status === 'completed' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${order.order_status === 'processing' || order.order_status === 'fulfilled' || order.order_status === 'completed' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <Clock className={`h-5 w-5 ${order.order_status === 'processing' || order.order_status === 'fulfilled' || order.order_status === 'completed' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${order.order_status === 'fulfilled' || order.order_status === 'completed' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <Truck className={`h-5 w-5 ${order.order_status === 'fulfilled' || order.order_status === 'completed' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full ${order.order_status === 'completed' ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                      <CheckCircle className={`h-5 w-5 ${order.order_status === 'completed' ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex justify-between text-sm font-medium text-gray-500">
                  <p>Nuovo</p>
                  <p>In lavorazione</p>
                  <p>Spedito</p>
                  <p>Completato</p>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Data ordine</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(order.order_date)}</p>
                  </div>
                  
                  {order.payment_date && (
                    <div>
                      <p className="text-sm text-gray-500">Data pagamento</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(order.payment_date)}</p>
                    </div>
                  )}
                  
                  {order.ship_date && (
                    <div>
                      <p className="text-sm text-gray-500">Data spedizione</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(order.ship_date)}</p>
                    </div>
                  )}
                  
                  {order.delivery_date && (
                    <div>
                      <p className="text-sm text-gray-500">Data consegna</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(order.delivery_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Informazioni spedizione */}
            {(order.fulfillment || tracking) && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Informazioni Spedizione
                </h2>
                
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Corriere</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.fulfillment?.carrier || tracking?.carrier || 'N/D'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Numero tracking</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center">
                        {order.fulfillment?.tracking_number || tracking?.tracking_number || 'N/D'}
                        {(order.fulfillment?.tracking_number || tracking?.tracking_number) && (
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(tracking?.tracking_url || `https://www.google.com/search?q=${order.fulfillment?.carrier || tracking?.carrier}+${order.fulfillment?.tracking_number || tracking?.tracking_number}`, '_blank');
                            }}
                            className="ml-2 text-indigo-600 hover:text-indigo-500"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {(order.fulfillment?.notes || tracking?.status) && (
                    <div>
                      <p className="text-sm text-gray-500">Note/Stato</p>
                      <p className="text-sm font-medium text-gray-900">
                        {order.fulfillment?.notes || tracking?.status || 'N/D'}
                      </p>
                    </div>
                  )}
                  
                  {tracking?.events && tracking.events.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900">Tracciamento</h3>
                      <ul className="mt-2 border-l-2 border-indigo-200 pl-4 space-y-2">
                        {tracking.events.map((event, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">
                              {formatDate(event.date)}:
                            </span>{' '}
                            {event.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Articoli ordine */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Articoli Ordinati
                </h2>
              </div>
              
              {/* Lista articoli */}
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prodotto
                      </th>
                      <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantità
                      </th>
                      <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prezzo
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Totale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-normal">
                            <div className="flex items-center">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.title} 
                                  className="h-10 w-10 object-cover rounded"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                {item.variation && (
                                  <div className="text-xs text-gray-500">
                                    Variante: {item.variation}
                                  </div>
                                )}
                                {item.sku && (
                                  <div className="text-xs text-gray-500">
                                    SKU: {item.sku}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {formatPrice(item.price, order.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity, order.currency)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          Nessun articolo trovato
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="2" className="p-0"></td>
                      <td className="px-3 py-3 text-right text-sm font-medium text-gray-500">Subtotale</td>
                      <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        {formatPrice(subtotal, order.currency)}
                      </td>
                    </tr>
                    
                    {shippingCost > 0 && (
                      <tr>
                        <td colSpan="2" className="p-0"></td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-gray-500">Spedizione</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                          {formatPrice(shippingCost, order.currency)}
                        </td>
                      </tr>
                    )}
                    
                    {taxAmount > 0 && (
                      <tr>
                        <td colSpan="2" className="p-0"></td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-gray-500">Tasse</td>
                        <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                          