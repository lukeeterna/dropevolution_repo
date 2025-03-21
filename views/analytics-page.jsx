// src/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Download, 
  Calendar, 
  RefreshCw, 
  ChevronDown,
  ShoppingCart,
  DollarSign,
  Package,
  Percent,
  AlertCircle
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProfitChart from '@/components/analytics/ProfitChart';
import StatCard from '@/components/common/StatCard';

import { 
  getAnalytics, 
  getRevenueData, 
  getTopProducts, 
  getTopCategories, 
  getMostProfitableProducts,
  exportAnalytics
} from '@/api/analytics';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    period: 'month',
    date_from: getLastMonthDate(),
    date_to: getCurrentDate()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Stati per i dati
  const [overview, setOverview] = useState({
    total_revenue: 0,
    total_profit: 0,
    total_orders: 0,
    average_order_value: 0,
    margin_percentage: 0,
    active_products: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [mostProfitableProducts, setMostProfitableProducts] = useState([]);

  // Helper per ottenere la data corrente formattata
  function getCurrentDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  // Helper per ottenere la data di un mese fa
  function getLastMonthDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  // Carica i dati all'avvio e quando cambia l'intervallo di date
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Esegui tutte le richieste in parallelo
        const [
          overviewResponse,
          revenueResponse,
          topProductsResponse,
          topCategoriesResponse,
          profitableProductsResponse
        ] = await Promise.all([
          getAnalytics(),
          getRevenueData(dateRange),
          getTopProducts({ ...dateRange, limit: 5 }),
          getTopCategories({ ...dateRange, limit: 5 }),
          getMostProfitableProducts({ ...dateRange, limit: 5 })
        ]);

        // Aggiorna gli stati con i dati ricevuti
        setOverview(overviewResponse.data || {});
        setRevenueData(revenueResponse.data || []);
        setTopProducts(topProductsResponse.data || []);
        setTopCategories(topCategoriesResponse.data || []);
        setMostProfitableProducts(profitableProductsResponse.data || []);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Errore durante il caricamento dei dati analitici. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Gestisci cambio periodo
  const handlePeriodChange = (period) => {
    let date_from;
    const date_to = getCurrentDate();

    switch (period) {
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        date_from = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        date_from = monthAgo.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterAgo = new Date();
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        date_from = quarterAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        date_from = yearAgo.toISOString().split('T')[0];
        break;
      default:
        date_from = getLastMonthDate();
    }

    setDateRange({ period, date_from, date_to });
    setShowDatePicker(false);
  };

  // Gestisci cambio date personalizzate
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Gestisci esportazione dati
  const handleExportData = async (type = 'csv') => {
    setExporting(true);
    
    try {
      const blob = await exportAnalytics({
        type,
        ...dateRange
      });
      
      // Crea URL per il download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics_${dateRange.date_from}_${dateRange.date_to}.${type}`;
      
      // Avvia il download
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting analytics:', err);
      setError('Errore durante l\'esportazione dei dati. Riprova più tardi.');
    } finally {
      setExporting(false);
    }
  };

  // Formatta numeri come valuta
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Periodi disponibili
  const periods = [
    { id: 'week', name: 'Ultima settimana' },
    { id: 'month', name: 'Ultimo mese' },
    { id: 'quarter', name: 'Ultimo trimestre' },
    { id: 'year', name: 'Ultimo anno' },
    { id: 'custom', name: 'Personalizzato' }
  ];

  if (loading) {
    return <LoadingSpinner text="Caricamento dati analitici..." />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          
          <div className="flex space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {periods.find(p => p.id === dateRange.period)?.name || 'Periodo'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              
              {/* Dropdown periodi */}
              {showDatePicker && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    {periods.map((period) => (
                      <button
                        key={period.id}
                        onClick={() => handlePeriodChange(period.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {period.name}
                      </button>
                    ))}
                    
                    {/* Date personalizzate */}
                    {dateRange.period === 'custom' && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <div className="mb-2">
                          <label htmlFor="date_from" className="block text-xs font-medium text-gray-700">
                            Data inizio
                          </label>
                          <input
                            type="date"
                            id="date_from"
                            name="date_from"
                            value={dateRange.date_from}
                            onChange={handleDateChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="date_to" className="block text-xs font-medium text-gray-700">
                            Data fine
                          </label>
                          <input
                            type="date"
                            id="date_to"
                            name="date_to"
                            value={dateRange.date_to}
                            onChange={handleDateChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Aggiorna
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleExportData('csv')}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Esportazione...' : 'Esporta CSV'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* Statistiche principali */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Fatturato Totale" 
            value={formatCurrency(overview.total_revenue || 0)}
            subValue={`Dal ${new Date(dateRange.date_from).toLocaleDateString()} al ${new Date(dateRange.date_to).toLocaleDateString()}`}
            icon="currency-dollar"
            color="bg-green-600"
          />
          <StatCard 
            title="Profitto Totale" 
            value={formatCurrency(overview.total_profit || 0)}
            subValue={`Margine: ${overview.margin_percentage?.toFixed(1) || 0}%`}
            icon="trending-up"
            color="bg-indigo-600"
          />
          <StatCard 
            title="Ordini Totali" 
            value={overview.total_orders || 0}
            subValue={`Valore medio: ${formatCurrency(overview.average_order_value || 0)}`}
            icon="shopping-cart"
            color="bg-blue-600"
          />
        </div>

        {/* Grafico andamento profitti */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Andamento Fatturato e Profitti</h2>
            <p className="mt-1 text-sm text-gray-500">
              {`Dal ${new Date(dateRange.date_from).toLocaleDateString()} al ${new Date(dateRange.date_to).toLocaleDateString()}`}
            </p>
          </div>
          
          <div className="p-6">
            {revenueData.length > 0 ? (
              <div className="h-80">
                <ProfitChart data={revenueData} />
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">Nessun dato disponibile per il periodo selezionato</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Prodotti e categorie */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Top prodotti */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Prodotti più venduti</h2>
              <p className="mt-1 text-sm text-gray-500">In base al numero di unità vendute</p>
            </div>
            
            <div className="p-6">
              {topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">{index + 1}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={product.title}>
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-500">
                            {product.quantity || 0} unità vendute
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(product.revenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">Nessun dato disponibile</p>
              )}
            </div>
          </div>
          
          {/* Prodotti più profittevoli */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Prodotti più profittevoli</h2>
              <p className="mt-1 text-sm text-gray-500">In base al profitto generato</p>
            </div>
            
            <div className="p-6">
              {mostProfitableProducts.length > 0 ? (
                <div className="space-y-4">
                  {mostProfitableProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-medium">{index + 1}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate" title={product.title}>
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-500">
                            Margine: {product.margin_percentage?.toFixed(1) || 0}%
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            {formatCurrency(product.profit || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">Nessun dato disponibile</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Categorie e altri indicatori */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Top categorie */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Categorie più popolari</h2>
              <p className="mt-1 text-sm text-gray-500">In base al fatturato generato</p>
            </div>
            
            <div className="p-6">
              {topCategories.length > 0 ? (
                <div className="space-y-4">
                  {topCategories.map((category, index) => (
                    <div key={category.id || index} className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">{index + 1}</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {category.name}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-500">
                            {category.products_count || 0} prodotti
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(category.revenue || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">Nessun dato disponibile</p>
              )}
            </div>
          </div>
          
          {/* KPI aggiuntivi */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Metriche chiave</h2>
              <p className="mt-1 text-sm text-gray-500">Indicatori di performance principali</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Valore medio ordine</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(overview.average_order_value || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Percent className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Margine medio</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {overview.margin_percentage?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Prodotti attivi</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {overview.active_products || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Totale ordini</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {overview.total_orders || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;