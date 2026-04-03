import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import './Auth.css';

export default function Register() {
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) newErrors.name = 'Имя должно быть не менее 2 символов';
    if (!form.email.trim()) newErrors.email = 'Email обязателен';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Неверный формат email';
    if (!form.password || form.password.length < 6) newErrors.password = 'Пароль должен быть не менее 6 символов';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';
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
      const res = await authAPI.register({ name: form.name.trim(), email: form.email.toLowerCase(), password: form.password });
      login(res.data.token, res.data.user);
      toast.success('Регистрация прошла успешно! Добро пожаловать!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Ошибка регистрации';
      toast.error(msg);
      if (msg.includes('email') || msg.includes('exists')) setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-scale">
        <div className="auth-card__icon">🚌</div>
        <h1 className="auth-card__title">{t('auth.register_title')}</h1>
        <p className="auth-card__subtitle">{t('auth.register_subtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} id="register-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">{t('auth.name')}</label>
            <input id="reg-name" name="name" type="text"
              className={`form-input ${errors.name ? 'form-input--error' : ''}`}
              placeholder="Иван Петров" value={form.name} onChange={handleChange} autoComplete="name" />
            {errors.name && <p className="form-error">⚠ {errors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">{t('auth.email')}</label>
            <input id="reg-email" name="email" type="email"
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
            {errors.email && <p className="form-error">⚠ {errors.email}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">{t('auth.password')}</label>
            <input id="reg-password" name="password" type="password"
              className={`form-input ${errors.password ? 'form-input--error' : ''}`}
              placeholder="Мин. 6 символов" value={form.password} onChange={handleChange} autoComplete="new-password" />
            {errors.password && <p className="form-error">⚠ {errors.password}</p>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">{t('auth.confirm_password')}</label>
            <input id="reg-confirm" name="confirmPassword" type="password"
              className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
              placeholder="Повторите пароль" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" />
            {errors.confirmPassword && <p className="form-error">⚠ {errors.confirmPassword}</p>}
          </div>
          <button id="register-submit-btn" type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? '⏳ Регистрация...' : t('auth.register_btn')}
          </button>
        </form>

        <p className="auth-redirect">
          {t('auth.has_account')}{' '}
          <Link to="/login" className="auth-redirect__link">{t('auth.login_link')}</Link>
        </p>
      </div>
    </div>
  );
}
