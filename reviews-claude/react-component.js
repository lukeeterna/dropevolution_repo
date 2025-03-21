// src/components/products/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Spinner, Alert, Pagination, Form, InputGroup } from 'react-bootstrap';
import apiService from '../../services/apiService';
import { useAuthContext } from '../../contexts/AuthContext';

const ProductList = () => {
  const { user } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const perPage = 10;
  
  // Effettua il fetch dei prodotti
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.products.getAll({
        page,
        per_page: perPage,
        search: searchTerm,
        sort_by: sortField,
        sort_order: sortOrder,
      });
      
      setProducts(response.data.items);
      setTotalPages(Math.ceil(response.data.total / perPage));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Carica i prodotti al mount e quando cambiano i parametri di ricerca/paginazione
  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, sortField, sortOrder]);
  
  // Gestisce la ricerca
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Resetta la paginazione quando si effettua una nuova ricerca
  };
  
  // Gestisce l'ordinamento delle colonne
  const handleSort = (field) => {
    if (sortField === field) {
      // Inverte l'ordine se il campo è già selezionato
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Imposta il nuovo campo e l'ordine di default
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Gestisce l'eliminazione di un prodotto
  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      try {
        await apiService.products.delete(id);
        // Aggiorna la lista dopo l'eliminazione
        fetchProducts();
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  // Renderizza un indicatore di caricamento
  if (loading && !products.length) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Caricamento in corso...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <div className="products-list my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Prodotti</h2>
        {user?.is_admin && (
          <Link to="/products/new">
            <Button variant="primary">Nuovo Prodotto</Button>
          </Link>
        )}
      </div>
      
      {/* Form di ricerca */}
      <Form onSubmit={handleSearch} className="mb-4">
        <InputGroup>
          <Form.Control
            type="text"
            placeholder="Cerca prodotti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="outline-primary">Cerca</Button>
        </InputGroup>
      </Form>
      
      {/* Messaggio di errore */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Tabella dei prodotti */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
              ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              Nome {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
              Prezzo {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('stock')} style={{ cursor: 'pointer' }}>
              Disponibilità {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
              Data {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>€{product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>{new Date(product.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Link to={`/products/${product.id}`}>
                      <Button variant="info" size="sm">Visualizza</Button>
                    </Link>
                    {user?.is_admin && (
                      <>
                        <Link to={`/products/${product.id}/edit`}>
                          <Button variant="warning" size="sm">Modifica</Button>
                        </Link>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          Elimina
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                Nessun prodotto trovato
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {/* Paginazione */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination>
            <Pagination.First 
              onClick={() => setPage(1)} 
              disabled={page === 1}
            />
            <Pagination.Prev 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
            />
            
            {[...Array(totalPages).keys()].map((p) => (
              <Pagination.Item
                key={p + 1}
                active={p + 1 === page}
                onClick={() => setPage(p + 1)}
              >
                {p + 1}
              </Pagination.Item>
            ))}
            
            <Pagination.Next 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
            />
            <Pagination.Last 
              onClick={() => setPage(totalPages)} 
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ProductList;
