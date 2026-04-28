import { useRef, useEffect, useState } from 'react';
import './ResultView.css';

export default function ResultView({ transparentPng, backgroundSrc, onRetake }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !transparentPng || !backgroundSrc) return;
    setReady(false);

    const bgImg = new Image();
    const personImg = new Image();
    let loaded = 0;

    const compose = () => {
      const ctx = canvas.getContext('2d');
      canvas.width = personImg.naturalWidth || 1280;
      canvas.height = personImg.naturalHeight || 720;
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(personImg, 0, 0, canvas.width, canvas.height);
      setReady(true);
    };

    const onLoad = () => { if (++loaded === 2) compose(); };
    bgImg.onload = onLoad;
    personImg.onload = onLoad;
    bgImg.src = backgroundSrc;
    personImg.src = transparentPng;
  }, [transparentPng, backgroundSrc]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.download = 'photo.jpg';
    a.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    a.click();
  };

  return (
    <div className="result-view">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
      <div className="result-controls">
        <button className="btn-secondary" onClick={onRetake}>Retake</button>
        {ready && (
          <button className="btn-primary" onClick={handleDownload}>Download</button>
        )}
      </div>
    </div>
  );
}
