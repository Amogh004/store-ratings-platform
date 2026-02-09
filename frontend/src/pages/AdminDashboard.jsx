import React, { useEffect, useMemo, useState } from 'react';
import api from '../api.js';

const NAME_MIN = 20;
const NAME_MAX = 60;
const ADDRESS_MAX = 400;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [userFilters, setUserFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: '',
  });
  const [storeFilters, setStoreFilters] = useState({
    name: '',
    email: '',
    address: '',
  });
  const [userSort, setUserSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [storeSort, setStoreSort] = useState({ sortBy: 'name', sortOrder: 'asc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    role: 'USER',
  });
  const [newStore, setNewStore] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      setStats(res.data);
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    const res = await api.get('/admin/users', {
      params: {
        ...userFilters,
        sortBy: userSort.sortBy,
        sortOrder: userSort.sortOrder,
      },
    });
    setUsers(res.data);
  };

  const fetchStores = async () => {
    const res = await api.get('/admin/stores', {
      params: {
        ...storeFilters,
        sortBy: storeSort.sortBy,
        sortOrder: storeSort.sortOrder,
      },
    });
    setStores(res.data);
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchStats(), fetchUsers(), fetchStores()]);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserFilterChange = (e) => {
    setUserFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleStoreFilterChange = (e) => {
    setStoreFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const applyUserFilters = () => {
    fetchUsers();
  };
  const applyStoreFilters = () => {
    fetchStores();
  };

  const toggleUserSort = (field) => {
    setUserSort((prev) => {
      const order =
        prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      const next = { sortBy: field, sortOrder: order };
      return next;
    });
    setTimeout(fetchUsers, 0);
  };

  const toggleStoreSort = (field) => {
    setStoreSort((prev) => {
      const order =
        prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      const next = { sortBy: field, sortOrder: order };
      return next;
    });
    setTimeout(fetchStores, 0);
  };

  const validateNewUser = () => {
    const errors = {};
    if (!newUser.name || newUser.name.length < NAME_MIN || newUser.name.length > NAME_MAX) {
      errors.newUserName = `Name must be between ${NAME_MIN} and ${NAME_MAX} characters`;
    }
    if (!newUser.address || newUser.address.length > ADDRESS_MAX) {
      errors.newUserAddress = `Address must be at most ${ADDRESS_MAX} characters`;
    }
    if (!newUser.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.newUserEmail = 'Invalid email';
    }
    if (!newUser.password) {
      errors.newUserPassword = 'Password is required';
    } else {
      if (newUser.password.length < 8 || newUser.password.length > 16) {
        errors.newUserPassword = 'Password must be 8-16 characters';
      } else if (!/[A-Z]/.test(newUser.password)) {
        errors.newUserPassword = 'Password must include an uppercase letter';
      } else if (!/[^A-Za-z0-9]/.test(newUser.password)) {
        errors.newUserPassword = 'Password must include a special character';
      }
    }
    return errors;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setServerMessage('');
    const errs = validateNewUser();
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.post('/admin/users', newUser);
      setServerMessage('User created successfully');
      setNewUser({
        name: '',
        email: '',
        address: '',
        password: '',
        role: 'USER',
      });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setServerMessage(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setServerMessage('');
    const errs = {};
    if (!newStore.name) errs.newStoreName = 'Store name is required';
    if (!newStore.address || newStore.address.length > ADDRESS_MAX) {
      errs.newStoreAddress = `Address must be at most ${ADDRESS_MAX} characters`;
    }
    if (!newStore.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStore.email)) {
      errs.newStoreEmail = 'Invalid email';
    }
    setFormErrors((prev) => ({ ...prev, ...errs }));
    if (Object.keys(errs).length) return;
    try {
      await api.post('/admin/stores', {
        ...newStore,
        ownerId: newStore.ownerId || undefined,
      });
      setServerMessage('Store created successfully');
      setNewStore({
        name: '',
        email: '',
        address: '',
        ownerId: '',
      });
      fetchStores();
      fetchStats();
    } catch (err) {
      setServerMessage(err.response?.data?.message || 'Failed to create store');
    }
  };

  const storeOwnerOptions = useMemo(
    () => users.filter((u) => u.role === 'STORE_OWNER'),
    [users]
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="muted">
          Manage users and stores, and see platform statistics.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Stores</div>
            <div className="stat-value">{stats.totalStores}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Ratings</div>
            <div className="stat-value">{stats.totalRatings}</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h2 className="card-title">Add New User</h2>
          {serverMessage && <div className="alert alert-info">{serverMessage}</div>}
          <form className="form" onSubmit={handleCreateUser}>
            <label className="form-label">
              Name
              <input
                className="form-input"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, name: e.target.value }))
                }
                minLength={NAME_MIN}
                maxLength={NAME_MAX}
                required
              />
              {formErrors.newUserName && (
                <span className="field-error">{formErrors.newUserName}</span>
              )}
            </label>
            <label className="form-label">
              Email
              <input
                className="form-input"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, email: e.target.value }))
                }
                required
              />
              {formErrors.newUserEmail && (
                <span className="field-error">{formErrors.newUserEmail}</span>
              )}
            </label>
            <label className="form-label">
              Address
              <textarea
                className="form-input"
                value={newUser.address}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, address: e.target.value }))
                }
                maxLength={ADDRESS_MAX}
                required
              />
              {formErrors.newUserAddress && (
                <span className="field-error">{formErrors.newUserAddress}</span>
              )}
            </label>
            <label className="form-label">
              Password
              <input
                className="form-input"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, password: e.target.value }))
                }
                required
              />
              <small className="muted">
                8–16 chars, at least 1 uppercase and 1 special character
              </small>
              {formErrors.newUserPassword && (
                <span className="field-error">{formErrors.newUserPassword}</span>
              )}
            </label>
            <label className="form-label">
              Role
              <select
                className="form-input"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, role: e.target.value }))
                }
              >
                <option value="USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Create User
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="card-title">Add New Store</h2>
          <form className="form" onSubmit={handleCreateStore}>
            <label className="form-label">
              Store Name
              <input
                className="form-input"
                value={newStore.name}
                onChange={(e) =>
                  setNewStore((s) => ({ ...s, name: e.target.value }))
                }
                required
              />
              {formErrors.newStoreName && (
                <span className="field-error">{formErrors.newStoreName}</span>
              )}
            </label>
            <label className="form-label">
              Store Email
              <input
                className="form-input"
                type="email"
                value={newStore.email}
                onChange={(e) =>
                  setNewStore((s) => ({ ...s, email: e.target.value }))
                }
                required
              />
              {formErrors.newStoreEmail && (
                <span className="field-error">{formErrors.newStoreEmail}</span>
              )}
            </label>
            <label className="form-label">
              Address
              <textarea
                className="form-input"
                value={newStore.address}
                onChange={(e) =>
                  setNewStore((s) => ({ ...s, address: e.target.value }))
                }
                maxLength={ADDRESS_MAX}
                required
              />
              {formErrors.newStoreAddress && (
                <span className="field-error">{formErrors.newStoreAddress}</span>
              )}
            </label>
            <label className="form-label">
              Store Owner (optional)
              <select
                className="form-input"
                value={newStore.ownerId}
                onChange={(e) =>
                  setNewStore((s) => ({ ...s, ownerId: e.target.value }))
                }
              >
                <option value="">Unassigned</option>
                {storeOwnerOptions.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" type="submit">
              Create Store
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Users</h2>
        </div>
        <div className="filters">
          <input
            className="form-input"
            placeholder="Filter by name"
            name="name"
            value={userFilters.name}
            onChange={handleUserFilterChange}
          />
          <input
            className="form-input"
            placeholder="Filter by email"
            name="email"
            value={userFilters.email}
            onChange={handleUserFilterChange}
          />
          <input
            className="form-input"
            placeholder="Filter by address"
            name="address"
            value={userFilters.address}
            onChange={handleUserFilterChange}
          />
          <select
            className="form-input"
            name="role"
            value={userFilters.role}
            onChange={handleUserFilterChange}
          >
            <option value="">All roles</option>
            <option value="USER">Normal User</option>
            <option value="STORE_OWNER">Store Owner</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button className="btn btn-secondary" onClick={applyUserFilters}>
            Apply
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <SortableTh field="name" onToggle={toggleUserSort} current={userSort}>
                Name
              </SortableTh>
              <SortableTh field="email" onToggle={toggleUserSort} current={userSort}>
                Email
              </SortableTh>
              <SortableTh field="address" onToggle={toggleUserSort} current={userSort}>
                Address
              </SortableTh>
              <SortableTh field="role" onToggle={toggleUserSort} current={userSort}>
                Role
              </SortableTh>
              <th>Store Rating (if owner)</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.address}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.role === 'STORE_OWNER'
                      ? u.ownerAverageRating
                        ? u.ownerAverageRating.toFixed(2)
                        : 'No ratings yet'
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Stores</h2>
        </div>
        <div className="filters">
          <input
            className="form-input"
            placeholder="Filter by name"
            name="name"
            value={storeFilters.name}
            onChange={handleStoreFilterChange}
          />
          <input
            className="form-input"
            placeholder="Filter by email"
            name="email"
            value={storeFilters.email}
            onChange={handleStoreFilterChange}
          />
          <input
            className="form-input"
            placeholder="Filter by address"
            name="address"
            value={storeFilters.address}
            onChange={handleStoreFilterChange}
          />
          <button className="btn btn-secondary" onClick={applyStoreFilters}>
            Apply
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <SortableTh field="name" onToggle={toggleStoreSort} current={storeSort}>
                Name
              </SortableTh>
              <SortableTh field="email" onToggle={toggleStoreSort} current={storeSort}>
                Email
              </SortableTh>
              <SortableTh field="address" onToggle={toggleStoreSort} current={storeSort}>
                Address
              </SortableTh>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  No stores found.
                </td>
              </tr>
            ) : (
              stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.address}</td>
                  <td>
                    {s.rating
                      ? `${s.rating.toFixed(2)} (${s.ratingCount} ratings)`
                      : 'No ratings yet'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh({ field, current, onToggle, children }) {
  const isActive = current.sortBy === field;
  const direction = isActive ? current.sortOrder : undefined;
  const label = direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '';

  return (
    <th className="sortable-th" onClick={() => onToggle(field)}>
      <span>
        {children} {label}
      </span>
    </th>
  );
}

