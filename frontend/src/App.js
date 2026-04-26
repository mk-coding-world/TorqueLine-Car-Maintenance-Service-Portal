import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const STATUS_STEPS = ['Pending', 'In Inspection', 'Under Repair', 'Completed'];
const SERVICE_TYPES = [
  'General Service',
  'Oil Change',
  'Battery Service',
  'Alignment & balancing',
  'Engine Repair',
  'Brake Service',
  'AC Service',
  'Electrical Service',
  'Full Inspection',
];

const healthBandEmoji = {
  Excellent: '🟢',
  Good: '🟡',
  'Needs Service': '🟠',
  Critical: '🔴',
};

const statusClass = {
  Pending: 'pending',
  'In Inspection': 'inspection',
  'Under Repair': 'repair',
  Completed: 'completed',
};

const formatDateTimeForInput = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const formatEtaDisplay = (dateValue) => {
  if (!dateValue) return 'TBD';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString();
};

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

const isValidDatetimeLocal = (value) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (networkError) {
    throw new Error('Cannot connect to backend API. Start server with "npm run dev" and verify MongoDB is running.');
  }

  const rawResponse = await response.text();
  let data = {};

  if (rawResponse) {
    try {
      data = JSON.parse(rawResponse);
    } catch (parseError) {
      data = { message: rawResponse };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [token, setToken] = useState(localStorage.getItem('st_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('st_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [historyData, setHistoryData] = useState(null);
  const [historyCarId, setHistoryCarId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [carForm, setCarForm] = useState({ model: '', number: '', year: '', mileage: '' });
  const [bookingForm, setBookingForm] = useState({ carId: '', serviceType: SERVICE_TYPES[0], appointmentDate: '', issues: '' });

  const [adminStatusForm, setAdminStatusForm] = useState({});
  const [adminDetailForm, setAdminDetailForm] = useState({});
  const [adminCarFilter, setAdminCarFilter] = useState('');
  const [adminHasSelectedCar, setAdminHasSelectedCar] = useState(false);
  const [actionPopup, setActionPopup] = useState({ open: false, text: '' });

  const latestBookings = useMemo(() => bookings.slice(0, 4), [bookings]);

  const adminCarOptions = useMemo(() => {
    const seenCars = new Set();

    return adminBookings
      .filter((booking) => booking.car?._id && !seenCars.has(booking.car._id))
      .map((booking) => {
        seenCars.add(booking.car._id);
        return booking.car;
      });
  }, [adminBookings]);

  const filteredAdminBookings = useMemo(() => {
    if (!adminHasSelectedCar || !adminCarFilter) return [];
    return adminBookings.filter((booking) => booking.car?._id === adminCarFilter);
  }, [adminBookings, adminCarFilter, adminHasSelectedCar]);

  useEffect(() => {
    if (!token) return;

    const refresh = async () => {
      try {
        setError('');
        if (user?.role === 'admin') {
          await fetchAdminBookings();
          return;
        }
        await Promise.all([fetchCars(), fetchBookings()]);
      } catch (err) {
        setError(err.message);
      }
    };

    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  useEffect(() => {
    if (!actionPopup.open) return;

    const timer = setTimeout(() => {
      setActionPopup({ open: false, text: '' });
    }, 2200);

    return () => clearTimeout(timer);
  }, [actionPopup]);

  const setSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('st_token', nextToken);
    localStorage.setItem('st_user', JSON.stringify(nextUser));
    setActiveTab(nextUser.role === 'admin' ? 'admin' : 'dashboard');
  };

  const logout = () => {
    setToken('');
    setUser(null);
    setCars([]);
    setBookings([]);
    setAdminBookings([]);
    setAdminCarFilter('');
    setAdminHasSelectedCar(false);
    setHistoryData(null);
    localStorage.removeItem('st_token');
    localStorage.removeItem('st_user');
  };

  const fetchCars = async () => {
    const data = await apiRequest('/customer/cars', { token });
    setCars(data);
  };

  const fetchBookings = async () => {
    const data = await apiRequest('/customer/bookings', { token });
    setBookings(data);
  };

  const fetchAdminBookings = async () => {
    const data = await apiRequest('/admin/bookings', { token });
    setAdminBookings(data);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (authMode === 'register' && authForm.name.trim().length < 2) {
      setError('Please enter a valid full name.');
      setLoading(false);
      return;
    }

    if (authMode === 'register' && !/^\d{10}$/.test(authForm.phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }

    if (!isValidEmail(authForm.email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (authForm.password.trim().length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : { name: authForm.name, phone: authForm.phone, email: authForm.email, password: authForm.password };

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: payload,
      });

      setSession(data.token, data.user);
      setMessage(`Welcome ${data.user.name}`);
    } catch (err) {
      if (authMode === 'login' && /invalid credentials/i.test(err.message)) {
        setError('Wrong password or email. Please check your input.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitCar = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!carForm.model.trim()) {
      setError('Please enter a car model.');
      return;
    }

    if (!carForm.number.trim()) {
      setError('Please enter a car number.');
      return;
    }

    const carYear = Number(carForm.year);
    if (!Number.isInteger(carYear) || carYear < 1990 || carYear > 2100) {
      setError('Please enter a valid car year.');
      return;
    }

    try {
      await apiRequest('/customer/cars', {
        method: 'POST',
        token,
        body: {
          model: carForm.model,
          number: carForm.number,
          year: carYear,
          mileage: Number(carForm.mileage || 0),
        },
      });
      setCarForm({ model: '', number: '', year: '', mileage: '' });
      await fetchCars();
      setMessage('Car added successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!bookingForm.carId) {
      setError('Please select a car.');
      return;
    }

    if (!SERVICE_TYPES.includes(bookingForm.serviceType)) {
      setError('Please select a valid service type.');
      return;
    }

    if (!isValidDatetimeLocal(bookingForm.appointmentDate)) {
      setError('Please choose a valid appointment date.');
      return;
    }

    try {
      await apiRequest('/customer/bookings', {
        method: 'POST',
        token,
        body: {
          ...bookingForm,
          issues: (bookingForm.issues || '')
            .split(',')
            .map((issue) => issue.trim())
            .filter(Boolean),
        },
      });

      setBookingForm({ carId: '', serviceType: SERVICE_TYPES[0], appointmentDate: '', issues: '' });
      await fetchBookings();
      setMessage('Service booked successfully.');
      setActiveTab('tracker');
    } catch (err) {
      setError(err.message);
    }
  };

  const loadHistory = async (carId) => {
    if (!carId) return;
    setError('');
    try {
      const data = await apiRequest(`/customer/history/${carId}`, { token });
      setHistoryData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAdminStatus = async (bookingId) => {
    const payload = adminStatusForm[bookingId] || {};
    const booking = adminBookings.find((item) => item._id === bookingId);

    if (payload.estimatedCompletionAt && !isValidDatetimeLocal(payload.estimatedCompletionAt)) {
      setError('Please choose a valid ETA date and time.');
      return;
    }

    try {
      await apiRequest(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        token,
        body: payload,
      });
      await fetchAdminBookings();
      setMessage('Status updated.');
      setActionPopup({
        open: true,
        text: `Status saved for ${booking?.car?.model || 'car'} (${booking?.car?.number || 'N/A'}).`,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAdminDetails = async (bookingId) => {
    const draft = adminDetailForm[bookingId] || {};
    const booking = adminBookings.find((item) => item._id === bookingId);

    const partsText = draft.parts || '';
    const hasInvalidParts = partsText
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .some((segment) => {
        const [name, cost] = segment.split(':');
        if (!name?.trim()) return true;
        if (cost === undefined || String(cost).trim() === '') return false;
        return Number.isNaN(Number(cost));
      });

    if (hasInvalidParts) {
      setError('Parts must be comma separated. Cost is optional, for example Engine Oil or Engine Oil:1800.');
      return;
    }

    try {
      await apiRequest(`/admin/bookings/${bookingId}/details`, {
        method: 'PATCH',
        token,
        body: {
          issues: (booking?.issues || []).map((issue) => String(issue).trim()).filter(Boolean),
          partsChanged: partsText
            .split(',')
            .map((segment) => segment.trim())
            .filter(Boolean)
            .map((segment) => {
              const [name, cost] = segment.split(':');
              return { name: (name || '').trim(), cost: cost === undefined || String(cost).trim() === '' ? 0 : Number(cost) };
            }),
          laborCost: Number(draft.laborCost || 0),
          notes: draft.notes || '',
        },
      });

      await fetchAdminBookings();
      setMessage('Service details updated.');
      setActionPopup({
        open: true,
        text: `Details saved for ${booking?.car?.model || 'car'} (${booking?.car?.number || 'N/A'}).`,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token || !user) {
    return (
      <div className="shell auth-shell">
        <div className="glow glow-left" />
        <div className="glow glow-right" />
        <main className="auth-card">
          <h1>TorqueLine Garage</h1>
          <p className="subtitle">Official-style service center workflow for modern garages.</p>
          <div className="auth-switch">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form" onSubmit={submitAuth}>
            {authMode === 'register' && (
              <>
                <label>
                  Full Name
                  <input
                    value={authForm.name}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="User Name"
                    required
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="10 digit phone number"
                    required
                  />
                </label>
              </>
            )}

            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="******"
                required
              />
            </label>

            <button className="cta" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          {message && <div className="toast success">{message}</div>}
          {error && <div className="toast error">{error}</div>}
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="bg-wave" />
      <header className="topbar">
        <div>
          <h1>ServiceTrack Pro</h1>
          <p>
            Welcome, {user.name} ({user.role})
          </p>
        </div>
        <button className="ghost" onClick={logout}>
          Logout
        </button>
      </header>

      {message && <div className="toast success">{message}</div>}
      {error && <div className="toast error">{error}</div>}
      {actionPopup.open && (
        <div className="action-popup" role="status" aria-live="polite">
          {actionPopup.text}
        </div>
      )}

      {user.role === 'customer' && (
        <nav className="tabs">
          {['dashboard', 'book', 'tracker', 'history'].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'dashboard' && 'My Cars'}
              {tab === 'book' && 'Book Service'}
              {tab === 'tracker' && 'Live Tracker'}
              {tab === 'history' && 'History & Health'}
            </button>
          ))}
        </nav>
      )}

      {user.role === 'customer' && activeTab === 'dashboard' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Add Car</h2>
            <form className="form" onSubmit={submitCar}>
              <label>
                Car Model
                <input
                  value={carForm.model}
                  onChange={(e) => setCarForm((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="Model Name"
                  required
                />
              </label>
              <label>
                Car Number
                <input
                  value={carForm.number}
                  onChange={(e) => setCarForm((prev) => ({ ...prev, number: e.target.value.toUpperCase() }))}
                  placeholder="Number Plate"
                  required
                />
              </label>
              <label>
                Year
                <input
                  type="number"
                  value={carForm.year}
                  onChange={(e) => setCarForm((prev) => ({ ...prev, year: e.target.value }))}
                  placeholder="Manufacture Year"
                  required
                />
              </label>
              <label>
                Kilometers(KM)
                <input
                  type="number"
                  value={carForm.mileage}
                  onChange={(e) => setCarForm((prev) => ({ ...prev, mileage: e.target.value }))}
                  placeholder="Km Driven"
                />
              </label>
              <button className="cta" type="submit">
                Add My Car
              </button>
            </form>
          </article>

          <article className="panel">
            <h2>My Cars Dashboard</h2>
            <div className="card-list">
              {cars.length === 0 && <p>No cars added yet.</p>}
              {cars.map((car) => (
                <div key={car._id} className="car-card">
                  <h3>{car.model}</h3>
                  <p>Number: {car.number}</p>
                  <p>Year: {car.year}</p>
                  <p>Mileage: {car.mileage} km</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {user.role === 'customer' && activeTab === 'book' && (
        <section className="panel single">
          <h2>Book Service Appointment</h2>
          <form className="form two-col" onSubmit={submitBooking}>
            <label>
              Select Car
              <select
                value={bookingForm.carId}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, carId: e.target.value }))}
                required
              >
                <option value="">Choose your car</option>
                {cars.map((car) => (
                  <option key={car._id} value={car._id}>
                    {car.model} ({car.number})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Service Type
              <select
                value={bookingForm.serviceType}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, serviceType: e.target.value }))}
                required
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Appointment Date
              <input
                type="date"
                value={bookingForm.appointmentDate}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                required
              />
            </label>

            <label>
              Issues (comma separated)
              <textarea
                value={bookingForm.issues}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, issues: e.target.value }))}
                placeholder="For example: Engine noise, Brake vibration"
              />
            </label>

            <button className="cta" type="submit">
              Confirm Booking
            </button>
          </form>
        </section>
      )}

      {user.role === 'customer' && activeTab === 'tracker' && (
        <section className="panel-grid">
          <article className="panel">
            <h2>Live Service Status</h2>
            <div className="card-list">
              {latestBookings.length === 0 && <p>No bookings found.</p>}
              {latestBookings.map((booking) => (
                <div key={booking._id} className="tracker-card">
                  <div className="tracker-head">
                    <strong>{booking.car?.number}</strong>
                    <span className={`status-badge ${statusClass[booking.status]}`}>{booking.status}</span>
                  </div>
                  <p>Service: {booking.serviceType}</p>
                  <p>Mechanic: {booking.mechanic}</p>
                  <p>ETA: {formatEtaDisplay(booking.estimatedCompletionAt)}</p>
                  <ol className="progress-row">
                    {STATUS_STEPS.map((step) => (
                      <li key={step} className={STATUS_STEPS.indexOf(step) <= STATUS_STEPS.indexOf(booking.status) ? 'done' : ''}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>Service Details & Billing</h2>
            <div className="card-list">
              {bookings.length === 0 && <p>No service details yet.</p>}
              {bookings.map((booking) => (
                <div key={booking._id} className="invoice-card">
                  <h3>{booking.car?.model} - {booking.car?.number}</h3>
                  <p>Status: {booking.status}</p>
                  <p>Issues: {booking.issues?.length ? booking.issues.join(', ') : 'No issues noted'}</p>
                  <p>
                    Parts: {booking.partsChanged?.length
                      ? booking.partsChanged.map((part) => `${part.name} (Rs.${part.cost})`).join(', ')
                      : 'No part changes'}
                  </p>
                  <p>Labor: Rs.{booking.laborCost || 0}</p>
                  <p className="bill">Total Bill: Rs.{booking.totalBill || 0}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {user.role === 'customer' && activeTab === 'history' && (
        <section className="panel single">
          <h2>Service History & Car Health</h2>
          <div className="history-controls">
            <select
              value={historyCarId}
              onChange={(e) => {
                const value = e.target.value;
                setHistoryCarId(value);
                loadHistory(value);
              }}
            >
              <option value="">Select a car</option>
              {cars.map((car) => (
                <option key={car._id} value={car._id}>
                  {car.model} ({car.number})
                </option>
              ))}
            </select>
          </div>

          {historyData && (
            <>
              <div className="health-box">
                <h3>{historyData.car.model} ({historyData.car.number})</h3>
                <p>
                  Health Score: <strong>{historyData.health.score}</strong> {healthBandEmoji[historyData.health.label]} {historyData.health.label}
                </p>
              </div>

              <div className="card-list">
                {historyData.history.length === 0 && <p>No completed service history yet.</p>}
                {historyData.history.map((item) => (
                  <div key={item._id} className="history-card">
                    <p>Date: {new Date(item.completedAt || item.updatedAt).toLocaleDateString()}</p>
                    <p>Type: {item.serviceType}</p>
                    <p>Cost: Rs.{item.totalBill || 0}</p>
                    <p>Notes: {item.notes || 'No notes'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {user.role === 'admin' && (
        <section className="panel single admin-panel">
          <h2>Admin Garage Panel</h2>
          <p>Manage bookings, update live status, add repair details, and generate bills.</p>

          <div className="history-controls">
            <select
              value={adminCarFilter}
              onChange={(e) => {
                setAdminHasSelectedCar(true);
                setAdminCarFilter(e.target.value);
              }}
            >
              <option value="">Select a car</option>
              {adminCarOptions.map((car) => (
                <option key={car._id} value={car._id}>
                  {car.model} ({car.number})
                </option>
              ))}
            </select>
          </div>

          <div className="card-list">
            {!adminHasSelectedCar && <p>Select a car from dropdown to view bookings.</p>}
            {adminHasSelectedCar && !adminCarFilter && <p>Select a car from dropdown to view bookings.</p>}
            {adminHasSelectedCar && adminCarFilter && filteredAdminBookings.length === 0 && <p>No bookings available for the selected car.</p>}
            {filteredAdminBookings.map((booking) => {
              const statusDraft = adminStatusForm[booking._id] || {
                status: booking.status,
                mechanic: booking.mechanic,
                estimatedCompletionAt: formatDateTimeForInput(booking.estimatedCompletionAt),
              };
              const detailsDraft = adminDetailForm[booking._id] || {
                parts: booking.partsChanged?.map((part) => `${part.name}:${part.cost}`).join(', ') || '',
                laborCost: booking.laborCost || 0,
                notes: booking.notes || '',
              };

              return (
                <div key={booking._id} className="admin-card">
                  <h3>{booking.car?.model} ({booking.car?.number})</h3>
                  <p>Customer: {booking.customer?.name} ({booking.customer?.email})</p>
                  <p>Service: {booking.serviceType}</p>

                  <div className="admin-forms">
                    <div>
                      <h4>Update Status</h4>
                      <select
                        value={statusDraft.status}
                        onChange={(e) =>
                          setAdminStatusForm((prev) => ({
                            ...prev,
                            [booking._id]: { ...statusDraft, status: e.target.value },
                          }))
                        }
                      >
                        {STATUS_STEPS.map((step) => (
                          <option key={step} value={step}>
                            {step}
                          </option>
                        ))}
                      </select>
                      <input
                        value={statusDraft.mechanic}
                        placeholder="Mechanic Name"
                        onChange={(e) =>
                          setAdminStatusForm((prev) => ({
                            ...prev,
                            [booking._id]: { ...statusDraft, mechanic: e.target.value },
                          }))
                        }
                      />
                      <label>
                        Service Done Date
                        <input
                          type="datetime-local"
                          value={statusDraft.estimatedCompletionAt || ''}
                          onChange={(e) =>
                            setAdminStatusForm((prev) => ({
                              ...prev,
                              [booking._id]: {
                                ...statusDraft,
                                estimatedCompletionAt: e.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <button className="cta" onClick={() => updateAdminStatus(booking._id)}>
                        Save Status
                      </button>
                    </div>

                    <div>
                      <h4>Repair & Billing</h4>
                      <input value={booking.serviceType || ''} placeholder="Service Type" readOnly />
                      <textarea
                        value={detailsDraft.parts}
                        placeholder="Part names or Part:Cost, for example Engine Oil, Filter:400"
                        onChange={(e) =>
                          setAdminDetailForm((prev) => ({
                            ...prev,
                            [booking._id]: { ...detailsDraft, parts: e.target.value },
                          }))
                        }
                      />
                      <input
                        type="number"
                        value={detailsDraft.laborCost}
                        placeholder="Labor Cost"
                        onChange={(e) =>
                          setAdminDetailForm((prev) => ({
                            ...prev,
                            [booking._id]: { ...detailsDraft, laborCost: e.target.value },
                          }))
                        }
                      />
                      <textarea
                        value={detailsDraft.notes}
                        placeholder="Additional notes"
                        onChange={(e) =>
                          setAdminDetailForm((prev) => ({
                            ...prev,
                            [booking._id]: { ...detailsDraft, notes: e.target.value },
                          }))
                        }
                      />
                      <button className="cta" onClick={() => updateAdminDetails(booking._id)}>
                        Save Details
                      </button>
                    </div>
                  </div>

                  <p className="bill">Current Bill: Rs.{booking.totalBill || 0}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
