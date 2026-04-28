import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

const CameraView = forwardRef(function CameraView({ activeBg }, ref) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const bgImageRef = useRef(null);
  const segRef = useRef(null);
  const animFrameRef = useRef(null);
  const processingRef = useRef(false);

  useImperativeHandle(ref, () => ({
    captureFrame: () =>
      new Promise((resolve) => {
        const video = videoRef.current;
        const c = document.createElement('canvas');
        c.width = video.videoWidth || 1280;
        c.height = video.videoHeight || 720;
        c.getContext('2d').drawImage(video, 0, 0);
        c.toBlob(resolve, 'image/jpeg', 0.95);
      }),
  }));

  useEffect(() => {
    if (!activeBg) return;
    const img = new Image();
    img.onload = () => { bgImageRef.current = img; };
    img.src = activeBg.src;
  }, [activeBg]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let closed = false;

    const seg = new SelfieSegmentation({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
    });

    seg.setOptions({ modelSelection: 1 });

    seg.onResults((results) => {
      if (closed) return;
      const ctx = canvas.getContext('2d');
      const { width, height } = canvas;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Draw camera frame, then mask to keep only the person
      ctx.drawImage(results.image, 0, 0, width, height);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);

      // Draw background behind the masked person
      ctx.globalCompositeOperation = 'destination-over';
      if (bgImageRef.current) {
        ctx.drawImage(bgImageRef.current, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#0f0f1a';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
      processingRef.current = false;
    });

    segRef.current = seg;

    const loop = () => {
      if (!processingRef.current && !closed && video.readyState >= 2) {
        processingRef.current = true;
        seg.send({ image: video }).catch(() => { processingRef.current = false; });
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
      .then((s) => {
        stream = s;
        video.srcObject = s;
        return video.play();
      })
      .then(() => {
        animFrameRef.current = requestAnimationFrame(loop);
      })
      .catch((err) => console.error('Camera access denied:', err));

    return () => {
      closed = true;
      cancelAnimationFrame(animFrameRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      seg.close();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
});

export default CameraView;
