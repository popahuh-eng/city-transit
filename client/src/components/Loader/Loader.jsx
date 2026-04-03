import './Loader.css';

export default function Loader({ size = 'md', text = '' }) {
  return (
    <div className={`loader-wrapper loader-wrapper--${size}`}>
      <div className="loader-spinner">
        <div className="loader-track" />
        <div className="loader-fill" />
        <div className="loader-bus">🚌</div>
      </div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
}
