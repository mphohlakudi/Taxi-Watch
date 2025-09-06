import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ReportData } from '../types';

interface ReportFormProps {
  onSubmit: (data: ReportData) => void;
  error: string | null;
  onCancel: () => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

export const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, error, onCancel }) => {
  const [description, setDescription] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPhotoOptionsOpen, setIsPhotoOptionsOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSubmittable = description.length > 10;
  
  useEffect(() => {
    // Clean up object URL and camera stream
    return () => {
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [photoPreview]);


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(URL.createObjectURL(file));
      // Reset file input value to allow re-uploading the same file
      e.target.value = '';
    }
  };
  
  const handleRemovePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOpen(true);
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setCameraError("Could not access the camera. Please check permissions and try again.");
        setIsCameraOpen(false);
      }
    } else {
        setCameraError("Camera not supported on this device or browser.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };
  
  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setPhoto(capturedFile);
            if (photoPreview) {
              URL.revokeObjectURL(photoPreview);
            }
            setPhotoPreview(URL.createObjectURL(capturedFile));
          }
        }, 'image/jpeg', 0.95);
      }
      stopCamera();
    }
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmittable) return;

    let photoData;
    if (photo) {
      const base64 = await fileToBase64(photo);
      photoData = { base64, mimeType: photo.type };
    }
    
    onSubmit({
      description,
      licensePlate,
      location,
      photo: photoData,
    });
  }, [description, licensePlate, location, photo, onSubmit, isSubmittable]);

  const handleTakePhotoClick = () => {
    setIsPhotoOptionsOpen(false);
    startCamera();
  };

  const handleChooseFromFileClick = () => {
    setIsPhotoOptionsOpen(false);
    fileInputRef.current?.click();
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {error && (
        <div className="bg-[--critical-red]/20 border border-[--critical-red] text-red-200 px-4 py-3 rounded-xl relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {cameraError && (
        <div className="bg-[--critical-red]/20 border border-[--critical-red] text-red-200 px-4 py-3 rounded-xl relative" role="alert">
          <strong className="font-bold">Camera Error: </strong>
          <span className="block sm:inline">{cameraError}</span>
        </div>
      )}
      <div>
        <label htmlFor="description" className="sr-only">
          What happened?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 text-lg text-[--primary-text] bg-[--tertiary-bg] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--critical-red] transition placeholder:text-[--secondary-text]"
          placeholder="Describe what happened..."
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="licensePlate" className="sr-only">
            License Plate (Optional)
          </label>
          <input
            type="text"
            id="licensePlate"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 text-[--primary-text] bg-[--tertiary-bg] rounded-full focus:outline-none focus:ring-2 focus:ring-[--critical-red] transition placeholder:text-[--secondary-text]"
            placeholder="License Plate"
          />
        </div>
        <div>
          <label htmlFor="location" className="sr-only">
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 text-[--primary-text] bg-[--tertiary-bg] rounded-full focus:outline-none focus:ring-2 focus:ring-[--critical-red] transition placeholder:text-[--secondary-text]"
            placeholder="Location"
          />
        </div>
      </div>

      <div>
          <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
          {photoPreview ? (
            <div className="relative group w-full aspect-video bg-[--tertiary-bg] rounded-xl flex items-center justify-center">
              <img src={photoPreview} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 h-8 w-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Remove photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div>
              <button
                  type="button"
                  onClick={() => setIsPhotoOptionsOpen(true)}
                  className="w-full flex flex-col items-center justify-center p-4 bg-[--tertiary-bg] rounded-xl hover:bg-opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[--critical-red] h-40"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[--secondary-text] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="text-lg font-medium text-[--primary-text]">Add Photo</span>
                  <span className="text-sm text-[--secondary-text]">Optional</span>
              </button>
              <p className="text-xs text-center text-[--secondary-text] mt-2">
                  For your privacy, please avoid capturing faces or other personal information.
              </p>
            </div>
          )}
      </div>
      
      <div className="flex flex-col gap-3 pt-4">
        <button
          type="submit"
          disabled={!isSubmittable}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full text-base font-semibold text-white bg-[--critical-red] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[--secondary-bg] focus:ring-[--critical-red] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          Submit Report
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-base font-medium text-[--secondary-text] hover:text-[--primary-text] focus:outline-none transition"
        >
          Cancel
        </button>
      </div>
    </form>
    
    {isCameraOpen && (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
           <button
              type="button"
              onClick={handleCapture}
              className="h-20 w-20 rounded-full border-4 border-white bg-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[--critical-red]"
              aria-label="Capture photo"
           ></button>
        </div>
        <button
          type="button"
          onClick={stopCamera}
          className="absolute top-4 right-4 h-12 w-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )}

    {isPhotoOptionsOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end animate-fade-in-fast" onClick={() => setIsPhotoOptionsOpen(false)} role="dialog" aria-modal="true" aria-labelledby="photo-options-title">
            <div className="bg-[--secondary-bg] w-full rounded-t-2xl p-4 space-y-2 animate-slide-up-fast" onClick={(e) => e.stopPropagation()}>
                <div className="p-2">
                    <h2 id="photo-options-title" className="text-lg font-semibold text-center text-[--primary-text]">Add a Photo</h2>
                    <p className="text-sm text-center text-[--secondary-text]">Choose how to add a photo to your report.</p>
                </div>
                <button
                    onClick={handleTakePhotoClick}
                    className="w-full text-center py-4 px-4 text-lg text-[--critical-red] bg-[--tertiary-bg] rounded-xl hover:opacity-80 transition"
                >
                    Take Photo
                </button>
                <button
                    onClick={handleChooseFromFileClick}
                    className="w-full text-center py-4 px-4 text-lg text-[--critical-red] bg-[--tertiary-bg] rounded-xl hover:opacity-80 transition"
                >
                    Photo Library
                </button>
                <div className="pt-2">
                    <button
                        onClick={() => setIsPhotoOptionsOpen(false)}
                        className="w-full text-center py-4 px-4 text-lg font-semibold text-[--critical-red] bg-[--tertiary-bg] rounded-xl hover:opacity-80 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};