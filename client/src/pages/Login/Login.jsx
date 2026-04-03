import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  /** Client-side validation before submitting */
  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = 'Email обязателен';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Неверный формат email';
    if (!form.password) newErrors.password = 'Пароль обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await authAPI.login(form);
      login(res.data.token, res.data.user);
      toast.success('Добро пожаловать, ' + res.data.user.name + '!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка входа';
      toast.error(msg);
      if (msg.includes('пользователя')) setErrors({ email: msg });
      else if (msg.includes('пароль') || msg.includes('Incorrect')) setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-scale">
        <div className="auth-card__icon">🚌</div>
        <h1 className="auth-card__title">{t('auth.login_title')}</h1>
        <p className="auth-card__subtitle">{t('auth.login_subtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} id="login-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">{t('auth.email')}</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <p className="form-error">⚠ {errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">{t('auth.password')}</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className={`form-input ${errors.password ? 'form-input--error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? '⏳ Вход...' : t('auth.login_btn')}
          </button>
        </form>

        <p className="auth-redirect" style={{ marginTop: '16px', marginBottom: '8px' }}>
          <Link to="/forgot-password" className="auth-redirect__link">Забыли пароль?</Link>
        </p>

        <p className="auth-redirect">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="auth-redirect__link">{t('auth.register_link')}</Link>
        </p>
      </div>
    </div>
  );
}
