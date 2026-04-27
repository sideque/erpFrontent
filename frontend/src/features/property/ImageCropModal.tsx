import { useState, useCallback, useEffect } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Modal } from '@shared/ui/Modal';
import { getCroppedImageBlob, blobToJpegFile } from '@shared/lib/imageCrop';

type ImageCropModalProps = {
  open: boolean;
  onClose: () => void;
  imageSrc: string | null;
  title?: string;
  onCropped: (file: File) => void;
};

const aspect = 4 / 3;

export function ImageCropModal({ open, onClose, imageSrc, title = 'Crop image', onCropped }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onComplete = useCallback((_area: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx);
  }, []);

  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open]);

  const apply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, 'image/jpeg', 0.9);
      const file = blobToJpegFile(blob);
      onCropped(file);
      onClose();
    } catch {
      // errors surfaced by axios toasts
    } finally {
      setSaving(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Drag to reframe, use the slider to zoom. Result is 4:3 (JPEG)."
      width="max-w-lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={() => void apply()} disabled={!croppedAreaPixels || saving}>
            {saving ? 'Processing…' : 'Use this crop'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-ink-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            showGrid
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <span className="shrink-0 w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-brand-600"
          />
        </label>
      </div>
    </Modal>
  );
}
