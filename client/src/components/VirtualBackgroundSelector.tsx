import React, { useState, useRef } from "react";
import { X, Loader2, Upload, ImageIcon } from "lucide-react";
import { useMediaContext } from "../context";
import type { BackgroundMode } from "../hooks";

interface VirtualBackgroundSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

// Preset background images (using free stock photo URLs)
const PRESET_BACKGROUNDS = [
    { id: 'office', label: 'Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' },
    { id: 'nature', label: 'Nature', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
    { id: 'beach', label: 'Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
    { id: 'city', label: 'City', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80' },
    { id: 'cozy', label: 'Cozy Room', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80' },
    { id: 'mountain', label: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
];

const VirtualBackgroundSelector: React.FC<VirtualBackgroundSelectorProps> = ({
    isOpen,
    onClose,
}) => {
    const { handleSelectBackground, setBackgroundImageFile, setBackgroundImageUrl, virtualBgMode, isVirtualBgLoading } = useMediaContext();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackgroundImageFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setSelectedPreset(null);
        }
    };

    const handlePresetSelect = (preset: typeof PRESET_BACKGROUNDS[0]) => {
        setBackgroundImageUrl(preset.url);
        setSelectedPreset(preset.id);
        setPreviewUrl(null);
    };

    const selectBackground = async (mode: BackgroundMode) => {
        await handleSelectBackground(mode);
        if (mode !== 'none') onClose();
    };

    const applyImageBackground = async () => {
        await handleSelectBackground('image');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="card-elevated p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-warm-light">Virtual Background</h2>
                    <button onClick={onClose} className="icon-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Options */}
                <div className="space-y-4">
                    {/* None */}
                    <button
                        onClick={() => selectBackground('none')}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${virtualBgMode === 'none'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-warm-light/10 hover:border-warm-light/30'
                            }`}
                    >
                        <div className="w-12 h-12 rounded-lg bg-warm-light/10 flex items-center justify-center text-2xl">
                            🚫
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-warm-light">No Background</div>
                            <div className="text-xs text-warm-light/50">Use your real background</div>
                        </div>
                    </button>

                    {/* Blur */}
                    <button
                        onClick={() => selectBackground('blur')}
                        disabled={isVirtualBgLoading}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${virtualBgMode === 'blur'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-warm-light/10 hover:border-warm-light/30'
                            } ${isVirtualBgLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className="w-12 h-12 rounded-lg bg-warm-light/10 flex items-center justify-center text-2xl">
                            {isVirtualBgLoading && virtualBgMode === 'blur' ? (
                                <Loader2 className="animate-spin text-primary-400" size={24} />
                            ) : '🔵'}
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-warm-light">Blur</div>
                            <div className="text-xs text-warm-light/50">Blur your background</div>
                        </div>
                    </button>

                    {/* Preset Backgrounds */}
                    <div className="border-2 border-warm-light/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon size={18} className="text-warm-light/50" />
                            <span className="font-medium text-warm-light">Preset Backgrounds</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {PRESET_BACKGROUNDS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetSelect(preset)}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedPreset === preset.id
                                        ? 'border-primary-500 ring-2 ring-primary-500/30'
                                        : 'border-transparent hover:border-warm-light/30'
                                        }`}
                                >
                                    <img
                                        src={preset.url}
                                        alt={preset.label}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <span className="absolute bottom-1 left-1 text-[10px] text-white font-medium">
                                        {preset.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {selectedPreset && (
                            <button
                                onClick={applyImageBackground}
                                disabled={isVirtualBgLoading}
                                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                            >
                                {isVirtualBgLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Applying...
                                    </>
                                ) : (
                                    'Apply Background'
                                )}
                            </button>
                        )}
                    </div>

                    {/* Custom Image Upload */}
                    <div
                        className={`w-full p-4 rounded-xl border-2 transition-all ${previewUrl
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-warm-light/10'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-warm-light/10 flex items-center justify-center text-2xl overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    '�'
                                )}
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-medium text-warm-light">Custom Image</div>
                                <div className="text-xs text-warm-light/50">Upload your own background</div>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="btn-secondary !px-3 !py-2 flex items-center gap-2"
                            >
                                <Upload size={16} />
                                Upload
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        {previewUrl && (
                            <button
                                onClick={applyImageBackground}
                                disabled={isVirtualBgLoading}
                                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                            >
                                {isVirtualBgLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Applying...
                                    </>
                                ) : (
                                    'Apply Image'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualBackgroundSelector;
