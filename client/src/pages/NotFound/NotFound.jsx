import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './NotFound.css';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="notfound-page">
      <div className="notfound-content animate-fade-in">
        <div className="notfound-number">
          <span>4</span>
          <span className="notfound-bus">🚌</span>
          <span>4</span>
        </div>
        <h1 className="notfound-title">{t('not_found.title')}</h1>
        <p className="notfound-subtitle">{t('not_found.subtitle')}</p>
        <Link to="/" className="btn btn-primary btn-lg">{t('not_found.go_home')}</Link>
      </div>
    </div>
  );
}
