import { useState, useEffect } from 'react';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      // Log install to analytics
      console.log('PWA was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt animate-slide-up">
      <div className="install-prompt__content">
        <div className="install-prompt__icon-wrapper">
          <span className="install-prompt__icon">📲</span>
        </div>
        <div className="install-prompt__text">
          <h4 className="install-prompt__title">Установить приложение</h4>
          <p className="install-prompt__desc">Добавьте АстанаТранзит на главный экран для быстрого доступа</p>
        </div>
      </div>
      <div className="install-prompt__actions">
        <button className="btn btn-secondary btn-sm" onClick={handleClose}>
          Позже
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleInstallClick}>
          Установить
        </button>
      </div>
    </div>
  );
}
