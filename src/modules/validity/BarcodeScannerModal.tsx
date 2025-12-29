import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Modal } from '../../components/Modal';
import './BarcodeScannerModal.css';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScan }) => {
    const readerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string>('');
    const scannerRegionId = 'html5-qrcode-reader';

    const handleStop = async () => {
        if (readerRef.current && readerRef.current.isScanning) {
            try {
                await readerRef.current.stop();
                readerRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
    };

    const handleModalClose = () => {
        handleStop().then(onClose);
    };

    useEffect(() => {
        if (!isOpen) {
            handleStop();
            return;
        }

        let isCancelled = false;

        const startScanner = async () => {
            try {
                // Initialize if not already done
                if (!readerRef.current) {
                    // Enable native BarcodeDetector if supported for better performance and orientation handling
                    readerRef.current = new Html5Qrcode(scannerRegionId, {
                        useBarCodeDetectorIfSupported: true,
                        verbose: false
                    });
                }

                // First, check if we have cameras permissions/availability
                let cameras;
                try {
                    cameras = await Html5Qrcode.getCameras();
                    if (!cameras || cameras.length === 0) {
                        throw new Error("Nenhuma câmera encontrada no dispositivo.");
                    }
                } catch (camErr) {
                    console.error("Error getting cameras:", camErr);
                    // Often this is where 'NotAllowedError' or Insecure Context errors happen
                    const message = camErr instanceof Error ? camErr.message : "Erro desconhecido";
                    throw new Error(message || "Erro de permissão ou contexto inseguro.");
                }

                // Config
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.QR_CODE
                    ]
                };

                // Try environment first, rely on library fallback if possible
                await readerRef.current.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        if (!isCancelled) {
                            if (navigator.vibrate) navigator.vibrate(200);
                            onScan(decodedText);
                            handleStop().then(onClose);
                        }
                    },
                    () => {
                        // Ignore parse errors
                    }
                );
            } catch (err) {
                if (!isCancelled) {
                    console.error("Error starting scanner:", err);
                    // Show specific error to user for debugging
                    const message = err instanceof Error ? err.message : JSON.stringify(err);
                    const name = err instanceof Error ? err.name : 'Erro';
                    setError(`${name}: ${message}`);
                }
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(startScanner, 100);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
            handleStop();
        };
    }, [isOpen, onClose, onScan]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleModalClose}
            title="Escanear Código"
            className="scanner-modal-content"
        >
            <div className="scanner-body">
                <div id={scannerRegionId} className="scanner-viewport-div"></div>

                <div className="scanner-guide-overlay">
                    <p className="scanner-instruction">Aponte para o código</p>
                </div>

                {error && (
                    <div className="scanner-error">
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
