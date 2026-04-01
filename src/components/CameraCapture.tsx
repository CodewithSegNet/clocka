import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Upload, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError('');
      setShowFallback(false);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser');
        setShowFallback(true);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err: any) {
      // Silently handle the error and show user-friendly message
      
      let errorMessage = 'Unable to access camera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings or use the upload option below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on this device. Please use the upload option below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application. Please close other apps and try again, or use the upload option below.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints could not be satisfied. Please use the upload option below.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Camera access is only available on secure (HTTPS) connections. Please use the upload option below.';
      } else {
        errorMessage = 'Unable to access camera. Please use the upload option below.';
      }
      
      setError(errorMessage);
      setShowFallback(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        stopCamera();
        onCapture(imageDataUrl);
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        stopCamera();
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black z-[100]" />
      
      {/* Camera Modal */}
      <div className="fixed inset-0 z-[101] flex flex-col">
        {/* Header */}
        <div className="bg-black/80 text-white p-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Take Photo</h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Preview or Error */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center p-6 max-w-md mx-auto">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-white mb-6 text-lg">{error}</p>
              
              {showFallback && (
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm mb-4">Choose an option:</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3"
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera App
                  </button>
                  
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.jpg,.jpeg,.png,.webp';
                      input.onchange = (e: any) => handleFileUpload(e);
                      input.click();
                    }}
                    className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-3"
                  >
                    <Upload className="w-5 h-5" />
                    Upload from Gallery
                  </button>
                  
                  <button
                    onClick={() => {
                      stopCamera();
                      onClose();
                    }}
                    className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              {!showFallback && (
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Controls */}
        {!error && (
          <div className="bg-black/80 p-6 flex items-center justify-center gap-6">
            <button
              onClick={switchCamera}
              className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            
            <button
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <div className="w-14 h-14 border-4 border-black rounded-full" />
            </button>
            
            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        )}
      </div>
    </>
  );
}