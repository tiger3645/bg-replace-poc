import './BackgroundPicker.css';

export default function BackgroundPicker({ backgrounds, activeBg, onSelect }) {
  return (
    <div className="bg-picker">
      {backgrounds.map((bg) => (
        <button
          key={bg.id}
          className={`bg-thumb${activeBg.id === bg.id ? ' active' : ''}`}
          onClick={() => onSelect(bg)}
          title={bg.label}
        >
          <img src={bg.src} alt={bg.label} />
          <span>{bg.label}</span>
        </button>
      ))}
    </div>
  );
}
