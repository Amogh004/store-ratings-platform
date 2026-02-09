import React, { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../authContext.jsx';

export default function UserStoresPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ name: '', address: '' });

  const fetchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/stores', {
        params: {
          name: filters.name || undefined,
          address: filters.address || undefined,
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
      setStores(res.data);
    } catch (err) {
      setError('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleApplyFilters = () => {
    fetchStores();
  };

  const updateRatingLocal = (storeId, rating) => {
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId
          ? {
              ...s,
              userRating: rating,
            }
          : s
      )
    );
  };

  const submitRating = async (storeId, rating, isUpdate) => {
    try {
      const method = isUpdate ? 'put' : 'post';
      await api[method](`/stores/${storeId}/ratings`, { rating });
      updateRatingLocal(storeId, rating);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stores</h1>
        <p className="muted">
          Search for stores and submit or update your ratings (1–5).
        </p>
      </div>

      <div className="filters">
        <input
          className="form-input"
          placeholder="Search by name"
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          className="form-input"
          placeholder="Search by address"
          name="address"
          value={filters.address}
          onChange={handleFilterChange}
        />
        <button className="btn btn-secondary" onClick={handleApplyFilters}>
          Apply Filters
        </button>
      </div>

      {loading ? (
        <p>Loading stores...</p>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Address</th>
                <th>Overall Rating</th>
                <th>Your Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>
                    No stores found.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <StoreRow
                    key={store.id}
                    store={store}
                    onSubmitRating={submitRating}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StoreRow({ store, onSubmitRating }) {
  const [value, setValue] = useState(store.userRating || 1);

  const handleSubmit = () => {
    const rating = Number(value);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      alert('Rating must be an integer between 1 and 5');
      return;
    }
    const isUpdate = !!store.userRating;
    onSubmitRating(store.id, rating, isUpdate);
  };

  return (
    <tr>
      <td>{store.name}</td>
      <td>{store.address}</td>
      <td>
        {store.overallRating
          ? `${store.overallRating.toFixed(2)} (${store.ratingCount} ratings)`
          : 'No ratings yet'}
      </td>
      <td>{store.userRating ?? 'Not rated'}</td>
      <td>
        <div className="rating-input">
          <input
            type="number"
            min={1}
            max={5}
            className="form-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button className="btn btn-primary btn-small" onClick={handleSubmit}>
            {store.userRating ? 'Update' : 'Submit'}
          </button>
        </div>
      </td>
    </tr>
  );
}

