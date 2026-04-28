import { useRef, useState } from 'react';
import CameraView from './components/CameraView';
import BackgroundPicker from './components/BackgroundPicker';
import ResultView from './components/ResultView';
import './App.css';

const BACKGROUNDS = [
  { id: 'beach', label: 'Beach', src: '/backgrounds/beach.jpg' },
  { id: 'city', label: 'City', src: '/backgrounds/city.jpg' },
  { id: 'space', label: 'Space', src: '/backgrounds/space.jpg' },
  { id: 'forest', label: 'Forest', src: '/backgrounds/forest.jpg' },
  { id: 'office', label: 'Office', src: '/backgrounds/office.jpg' },
];

export default function App() {
  const [activeBg, setActiveBg] = useState(BACKGROUNDS[0]);
  const [result, setResult] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const blob = await cameraRef.current.captureFrame();
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      const res = await fetch('/remove-bg', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const resultBlob = await res.blob();
      setResult(URL.createObjectURL(resultBlob));
    } catch (err) {
      console.error(err);
      alert('Could not process photo. Is the backend running?\n\ncd backend && uvicorn main:app --reload');
    } finally {
      setCapturing(false);
    }
  };

  const handleRetake = () => {
    if (result) URL.revokeObjectURL(result);
    setResult(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Background Replace</h1>
      </header>
      <main className="app-main">
        <div className="viewport">
          {result ? (
            <ResultView
              transparentPng={result}
              backgroundSrc={activeBg.src}
              onRetake={handleRetake}
            />
          ) : (
            <CameraView ref={cameraRef} activeBg={activeBg} />
          )}
        </div>
        <BackgroundPicker
          backgrounds={BACKGROUNDS}
          activeBg={activeBg}
          onSelect={setActiveBg}
        />
        {!result && (
          <div className="controls">
            <button
              className="btn-capture"
              onClick={handleCapture}
              disabled={capturing}
            >
              {capturing ? 'Processing…' : 'Take Photo'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
