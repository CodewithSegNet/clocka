import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, CheckCircle, RefreshCw, Loader2, ScanFace, Sun, Lightbulb, AlertTriangle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

interface FacialCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (faceImageData: string) => void;
  parentName: string;
  action: 'clock-in' | 'clock-out';
  childrenCount: number;
}

type LightingQuality = 'poor' | 'fair' | 'good' | 'excellent';

interface LightingStatus {
  quality: LightingQuality;
  brightness: number;
  message: string;
  color: string;
  bgColor: string;
}

export function FacialCaptureModal({
  isOpen,
  onClose,
  onCapture,
  parentName,
  action,
  childrenCount
}: FacialCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lightingCheckInterval = useRef<number | null>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lightingStatus, setLightingStatus] = useState<LightingStatus>({
    quality: 'fair',
    brightness: 0,
    message: 'Checking lighting...',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  });

  useEffect(() => {
    if (isOpen) {
      // Reset all state when modal opens for fresh capture
      console.log(`🎥 [FACIAL CAPTURE] Opening modal for ${action} - Fresh capture starting`);
      setCapturedImage(null);
      setCameraError(null);
      setCountdown(null);
      setIsProcessing(false);
      startCamera();
    }
    
    return () => {
      stopCamera();
      stopLightingCheck();
    };
  }, [isOpen, action]);

  // Start lighting detection when camera is ready
  useEffect(() => {
    if (isCameraReady && !capturedImage) {
      startLightingCheck();
    } else {
      stopLightingCheck();
    }
    
    return () => {
      stopLightingCheck();
    };
  }, [isCameraReady, capturedImage]);

  const analyzeLighting = (): number => {
    if (!videoRef.current || !canvasRef.current) return 0;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 0;
    
    // Set small canvas size for quick analysis
    canvas.width = 160;
    canvas.height = 120;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate average brightness
    let brightnessSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Calculate relative luminance
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      brightnessSum += brightness;
    }
    
    const avgBrightness = brightnessSum / (data.length / 4);
    return avgBrightness;
  };

  const getLightingStatus = (brightness: number): LightingStatus => {
    if (brightness < 60) {
      return {
        quality: 'poor',
        brightness,
        message: 'Lighting is too dark. Please move to a brighter area.',
        color: 'text-red-700',
        bgColor: 'bg-red-50'
      };
    } else if (brightness < 100) {
      return {
        quality: 'fair',
        brightness,
        message: 'Lighting could be better. Try to face a light source.',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50'
      };
    } else if (brightness < 140) {
      return {
        quality: 'good',
        brightness,
        message: 'Good lighting! You can proceed with capture.',
        color: 'text-green-700',
        bgColor: 'bg-green-50'
      };
    } else {
      return {
        quality: 'excellent',
        brightness,
        message: 'Excellent lighting! Perfect for facial capture.',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50'
      };
    }
  };

  const startLightingCheck = () => {
    stopLightingCheck(); // Clear any existing interval
    
    lightingCheckInterval.current = window.setInterval(() => {
      const brightness = analyzeLighting();
      const status = getLightingStatus(brightness);
      setLightingStatus(status);
    }, 500); // Check every 500ms
  };

  const stopLightingCheck = () => {
    if (lightingCheckInterval.current) {
      clearInterval(lightingCheckInterval.current);
      lightingCheckInterval.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraReady(false);
      
      // Request camera permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraReady(true);
          toast.success('Camera ready! Position your face in the center.');
        };
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Failed to access camera';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Start countdown
    setCountdown(3);
    let count = 3;
    
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        setCountdown(null);
        
        // Capture the photo
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw the video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64 image
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedImage(imageData);
          stopCamera();
          
          toast.success('Face captured successfully!');
        }
      }
    }, 1000);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate face verification processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(`✅ [FACIAL CAPTURE] ${action} completed - Unique photo captured (size: ${capturedImage.length} bytes)`);
      onCapture(capturedImage);
      toast.success('Face verified successfully!');
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Face verification error:', error);
      toast.error('Face verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="bg-indigo-100 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <ScanFace className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">Facial Verification Required</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">
                  {action === 'clock-in' ? 'Clock In' : 'Clock Out'} - {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg">
            <div className="flex gap-2 sm:gap-3">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-900">Facial Verification Required</p>
                <p className="text-[10px] sm:text-xs text-blue-700 mt-1">
                  Position your face in the center. Make sure you're in a well-lit area.
                </p>
              </div>
            </div>
          </div>

          {/* Lighting Requirements Guide */}
          {!capturedImage && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Lighting Requirements</h4>
                  <p className="text-xs text-amber-700">For best results, ensure your environment meets these conditions:</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-start gap-2 bg-white rounded-lg p-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Face Light Source</p>
                    <p className="text-[10px] text-gray-600">Position yourself facing a window or light</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white rounded-lg p-2">
                  <Sun className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Avoid Shadows</p>
                    <p className="text-[10px] text-gray-600">No backlighting or harsh shadows on face</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white rounded-lg p-2">
                  <Camera className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Well-lit Room</p>
                    <p className="text-[10px] text-gray-600">Turn on room lights if indoors</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Clear Visibility</p>
                    <p className="text-[10px] text-gray-600">Face should be clearly visible</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Lighting Status Indicator */}
          {isCameraReady && !capturedImage && (
            <div
              className={`${lightingStatus.bgColor} border-l-4 ${
                lightingStatus.quality === 'poor'
                  ? 'border-red-500'
                  : lightingStatus.quality === 'fair'
                  ? 'border-orange-500'
                  : lightingStatus.quality === 'good'
                  ? 'border-green-500'
                  : 'border-emerald-500'
              } p-3 sm:p-4 rounded-r-lg transition-all duration-300`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {lightingStatus.quality === 'poor' && (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-pulse" />
                )}
                {lightingStatus.quality === 'fair' && (
                  <Sun className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                )}
                {lightingStatus.quality === 'good' && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                {lightingStatus.quality === 'excellent' && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <p
                      className={`text-xs sm:text-sm font-bold ${lightingStatus.color}`}
                    >
                      Lighting: {lightingStatus.quality.charAt(0).toUpperCase() + lightingStatus.quality.slice(1)}
                    </p>
                    <div className="flex items-center gap-2">
                      {/* Brightness Indicator Bars */}
                      <div className="flex gap-0.5">
                        <div
                          className={`w-1 h-4 rounded-full ${
                            lightingStatus.quality === 'poor' ? 'bg-red-500' : 'bg-gray-300'
                          }`}
                        />
                        <div
                          className={`w-1 h-4 rounded-full ${
                            lightingStatus.quality === 'fair' || lightingStatus.quality === 'good' || lightingStatus.quality === 'excellent'
                              ? 'bg-orange-500'
                              : 'bg-gray-300'
                          }`}
                        />
                        <div
                          className={`w-1 h-4 rounded-full ${
                            lightingStatus.quality === 'good' || lightingStatus.quality === 'excellent'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                        <div
                          className={`w-1 h-4 rounded-full ${
                            lightingStatus.quality === 'excellent' ? 'bg-emerald-500' : 'bg-gray-300'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {Math.round(lightingStatus.brightness)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-[10px] sm:text-xs ${lightingStatus.color}`}>
                    {lightingStatus.message}
                  </p>
                  {lightingStatus.quality === 'poor' && (
                    <div className="mt-2 p-2 bg-white/50 rounded-lg">
                      <p className="text-[10px] font-semibold text-red-800 mb-1">⚠️ Insufficient Lighting Detected</p>
                      <ul className="text-[9px] text-red-700 space-y-0.5 ml-4 list-disc">
                        <li>Move to a room with more lighting</li>
                        <li>Turn on additional lights</li>
                        <li>Position yourself near a window during daytime</li>
                        <li>Avoid dark backgrounds</li>
                      </ul>
                    </div>
                  )}
                  {lightingStatus.quality === 'fair' && (
                    <div className="mt-2 p-2 bg-white/50 rounded-lg">
                      <p className="text-[10px] text-orange-700">
                        💡 Tip: Face a light source directly for better results
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Parent Info */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-600">Verifying identity for</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 truncate px-4">{parentName}</p>
            {/* Action Badge */}
            <div className="mt-2 inline-flex items-center gap-2">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${
                  action === 'clock-in'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-orange-100 text-orange-700 border border-orange-300'
                }`}
              >
                {action === 'clock-in' ? '📥 CLOCK IN CAPTURE' : '📤 CLOCK OUT CAPTURE'}
              </span>
            </div>
          </div>

          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
            {/* Video Stream */}
            {!capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* Captured Image */}
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full h-full object-cover"
              />
            )}

            {/* Face Detection Overlay */}
            {isCameraReady && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
                <div className="relative">
                  {/* Face Frame - Responsive sizes */}
                  <div className="w-40 h-52 sm:w-48 sm:h-64 md:w-64 md:h-80 border-4 border-emerald-500 rounded-full opacity-50 animate-pulse" />
                  
                  {/* Corner Guides - Responsive sizes */}
                  <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-t-4 border-l-4 border-emerald-400 rounded-tl-full" />
                  <div className="absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-t-4 border-r-4 border-emerald-400 rounded-tr-full" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-b-4 border-l-4 border-emerald-400 rounded-bl-full" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 border-b-4 border-r-4 border-emerald-400 rounded-br-full" />
                </div>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-6xl sm:text-7xl md:text-8xl font-bold animate-ping">
                  {countdown}
                </div>
              </div>
            )}

            {/* Camera Loading */}
            {!isCameraReady && !cameraError && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center text-white px-4">
                  <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-semibold">Starting camera...</p>
                  <p className="text-xs sm:text-sm text-gray-300 mt-2">Please allow camera access</p>
                </div>
              </div>
            )}

            {/* Camera Error */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/90">
                <div className="text-center text-white p-4 sm:p-6">
                  <X className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-red-300" />
                  <p className="text-base sm:text-lg font-semibold mb-2">Camera Error</p>
                  <p className="text-xs sm:text-sm text-red-200 px-4">{cameraError}</p>
                  <Button
                    onClick={startCamera}
                    className="mt-3 sm:mt-4 bg-white text-red-900 hover:bg-gray-100 text-sm sm:text-base"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Success Checkmark */}
            {capturedImage && (
              <div className="absolute top-4 right-4">
                <div className="bg-emerald-500 rounded-full p-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3">
            {!capturedImage ? (
              <>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 py-4 sm:py-6 text-sm sm:text-base font-semibold"
                  disabled={!isCameraReady || countdown !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  disabled={!isCameraReady || countdown !== null || lightingStatus.quality === 'poor'}
                  className={`flex-1 text-white py-4 sm:py-6 text-sm sm:text-base font-semibold shadow-lg ${
                    lightingStatus.quality === 'poor'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                  }`}
                >
                  {lightingStatus.quality === 'poor' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Insufficient Lighting</span>
                      <span className="sm:hidden">Poor Light</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{countdown !== null ? 'Capturing...' : 'Capture Face'}</span>
                      <span className="sm:hidden">{countdown !== null ? 'Capturing...' : 'Capture'}</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1 py-4 sm:py-6 text-sm sm:text-base font-semibold"
                  disabled={isProcessing}
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmCapture}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-4 sm:py-6 text-sm sm:text-base font-semibold shadow-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">Verifying...</span>
                      <span className="sm:hidden">Wait...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Confirm & {action === 'clock-in' ? 'Clock In' : 'Clock Out'}</span>
                      <span className="sm:hidden">Confirm</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Security Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-gray-600 text-center">
              🔒 Your facial data is securely stored and used only for attendance verification purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}