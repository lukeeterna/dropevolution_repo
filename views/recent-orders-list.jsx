// src/components/orders/RecentOrdersList.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Clock, AlertCircle, CheckCircle, Truck, DollarSign } from 'lucide-react';

const RecentOrdersList = ({ orders }) => {
  const navigate = useNavigate();

  if (!orders || orders.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Nessun ordine trovato. Gli ordini appariranno qui quando ne riceverai.</p>
      </div>
    );
  }

  const handleOrderClick = (orderId) => {
    navigate(`/orders/${orderId}`);
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
      year: 'numeric'
    });
  };

  // Ottieni informazioni sullo stato dell'ordine
  const getStatusInfo = (status) => {
    switch (status) {
      case 'new':
        return { 
          name: 'Nuovo', 
          icon: AlertCircle, 
          className: 'bg-yellow-100 text-yellow-800' 
        };
      case 'processing':
        return { 
          name: 'In lavorazione', 
          icon: Clock, 
          className: 'bg-blue-100 text-blue-800' 
        };
      case 'fulfilled':
        return { 
          name: 'Spedito', 
          icon: Truck, 
          className: 'bg-indigo-100 text-indigo-800' 
        };
      case 'completed':
        return { 
          name: 'Completato', 
          icon: CheckCircle, 
          className: 'bg-green-100 text-green-800' 
        };
      case 'cancelled':
        return { 
          name: 'Annullato', 
          icon: AlertCircle, 
          className: 'bg-red-100 text-red-800' 
        };
      default:
        return { 
          name: status || 'Sconosciuto', 
          icon: Package, 
          className: 'bg-gray-100 text-gray-800' 
        };
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.order_status);
        const StatusIcon = statusInfo.icon;
        
        return (
          <div 
            key={order.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleOrderClick(order.id)}
          >
            <div className="flex items-center">
              {/* Icona ordine */}
              <div className="flex-shrink-0">
                <Package className="h-10 w-10 text-gray-400" />
              </div>

              {/* Informazioni ordine */}
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      #{order.ebay_order_id || order.id.substring(0, 8)}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Data: {formatDate(order.order_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(order.order_total, order.currency)}
                    </p>
                    <div className="text-xs text-green-600 flex items-center justify-end mt-1">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatPrice(order.profit || order.order_total * 0.2, order.currency)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.name}
                  </span>
                  
                  <p className="text-xs text-gray-500">
                    {order.buyer_name || 'Cliente'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

RecentOrdersList.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      ebay_order_id: PropTypes.string,
      order_date: PropTypes.string,
      order_total: PropTypes.number,
      profit: PropTypes.number,
      currency: PropTypes.string,
      buyer_name: PropTypes.string,
      order_status: PropTypes.string
    })
  )
};

RecentOrdersList.defaultProps = {
  orders: []
};

export default RecentOrdersList;