import React, { useEffect, useState } from 'react';
import api from '../api.js';

export default function OwnerDashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/owner/dashboard');
        setStores(res.data);
      } catch (err) {
        setError('Failed to load owner dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Store Owner Dashboard</h1>
        <p className="muted">
          View your stores, average rating, and users who rated them.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : stores.length === 0 ? (
        <div className="card">
          <p>You are not assigned to any stores yet.</p>
        </div>
      ) : (
        stores.map((store) => (
          <div className="card" key={store.id}>
            <div className="card-header">
              <div>
                <h2 className="card-title">{store.name}</h2>
                <p className="muted">{store.address}</p>
              </div>
              <div className="stat-inline">
                <span className="stat-label">Average Rating</span>
                <span className="stat-value">
                  {store.averageRating
                    ? `${store.averageRating.toFixed(2)} (${store.ratingCount} ratings)`
                    : 'No ratings yet'}
                </span>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {store.ratings.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center' }}>
                      No ratings yet.
                    </td>
                  </tr>
                ) : (
                  store.ratings.map((r) => (
                    <tr key={r.id}>
                      <td>{r.user?.name}</td>
                      <td>{r.user?.email}</td>
                      <td>{r.user?.address}</td>
                      <td>{r.rating}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

