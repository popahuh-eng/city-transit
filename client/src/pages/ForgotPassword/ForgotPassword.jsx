import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../Login/Auth.css';

export default function ForgotPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = email, 2 = code & new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    setError('');
    
    try {
      setLoading(true);
      await authAPI.forgotPassword({ email });
      setStep(2);
      toast.success('Код отправлен на ваш email (если аккаунт существует)');
    } catch (err) {
      setError('Ошибка при запросе кода. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code.trim() || newPassword.length < 6) {
      setError('Введите код из письма и новый пароль от 6 символов');
      return;
    }
    setError('');

    try {
      setLoading(true);
      await authAPI.resetPassword({ email, code, newPassword });
      toast.success('Пароль успешно изменен!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный код или код истек');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-scale">
        <div className="auth-card__icon">🔑</div>
        <h1 className="auth-card__title">Восстановление пароля</h1>
        <p className="auth-card__subtitle">
          {step === 1 
            ? 'Введите email, чтобы получить код для сброса'
            : 'Введите код из письма и ваш новый пароль'
          }
        </p>

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleRequestCode} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                className={`form-input ${error ? 'form-input--error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="form-error">⚠ {error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? '⏳ Отправка...' : 'Отправить код'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            <div className="form-group">
              <label className="form-label">Секретный код из письма</label>
              <input
                name="code"
                type="text"
                className="form-input"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Новый пароль</label>
              <input
                name="newPassword"
                type="password"
                className="form-input"
                placeholder="Минимум 6 символов"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            {error && <p className="form-error">⚠ {error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '16px' }}>
              {loading ? '⏳ Проверка...' : 'Сохранить новый пароль'}
            </button>
          </form>
        )}

        <p className="auth-redirect" style={{ marginTop: '24px' }}>
          Вспомнили пароль?{' '}
          <Link to="/login" className="auth-redirect__link">Вернуться ко входу</Link>
        </p>
      </div>
    </div>
  );
}
