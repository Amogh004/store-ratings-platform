import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../authContext.jsx';

const NAME_MIN = 20;
const NAME_MAX = 60;
const ADDRESS_MAX = 400;

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.length < NAME_MIN || form.name.length > NAME_MAX) {
      newErrors.name = `Name must be between ${NAME_MIN} and ${NAME_MAX} characters`;
    }
    if (!form.address || form.address.length > ADDRESS_MAX) {
      newErrors.address = `Address must be at most ${ADDRESS_MAX} characters`;
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else {
      if (form.password.length < 8 || form.password.length > 16) {
        newErrors.password = 'Password must be 8-16 characters';
      } else if (!/[A-Z]/.test(form.password)) {
        newErrors.password = 'Password must include an uppercase letter';
      } else if (!/[^A-Za-z0-9]/.test(form.password)) {
        newErrors.password = 'Password must include a special character';
      }
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      login(res.data.token, res.data.user);
      navigate('/stores');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h1 className="card-title">Sign Up</h1>
        {serverError && <div className="alert alert-error">{serverError}</div>}
        <form className="form" onSubmit={handleSubmit}>
          <label className="form-label">
            Name
            <input
              className="form-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={NAME_MIN}
              maxLength={NAME_MAX}
              required
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="form-label">
            Email
            <input
              className="form-input"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="form-label">
            Address
            <textarea
              className="form-input"
              name="address"
              value={form.address}
              onChange={handleChange}
              maxLength={ADDRESS_MAX}
              required
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </label>
          <label className="form-label">
            Password
            <input
              className="form-input"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <small className="muted">
              8–16 chars, at least 1 uppercase and 1 special character
            </small>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

