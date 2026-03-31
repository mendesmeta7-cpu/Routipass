"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanType, Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { Loader2, Camera, X } from "lucide-react";

interface ScannerQRProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function ScannerQR({ onScanSuccess, onClose }: ScannerQRProps) {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let active = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            if (active) {
              active = false;
              onScanSuccess(decodedText);
            }
          },
          () => {}
        );

        if (active) setHasPermission(true);
      } catch (err: any) {
        if (active) {
          console.error("Camera error:", err);
          setErrorText("Impossible d'accéder à la caméra.");
        }
      }
    };

    startScanner();

    return () => {
      active = false;
      const scanner = scannerRef.current;
      if (scanner) {
        // We use a small timeout to ensure the scanner instance is truly ready to be stopped
        // This avoids the 'Cannot clear while scan is ongoing' error from html5-qrcode
        setTimeout(async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
            scanner.clear();
          } catch (e) {
            // Silently ignore if cleanup fails on unmount
          }
        }, 300);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <Camera className="w-10 h-10 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black text-white tracking-tight">Scanner QR Code</h2>
          <p className="text-slate-400 font-medium text-sm mt-2">Placez le QR Code de l'usager dans le cadre</p>
        </div>

        <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-slate-800 shadow-2xl shadow-blue-500/20">
          {!hasPermission && !errorText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0F172A] z-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initialisation...</p>
            </div>
          )}
          
          {errorText && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center bg-rose-950/90 z-10">
              <p className="text-rose-400 font-bold text-sm">{errorText}</p>
            </div>
          )}

          <div id="reader" className="w-full aspect-square" />
          
          {/* Overlay scanner effect */}
          <div className="absolute inset-0 pointer-events-none border-[3px] border-blue-500/50 rounded-3xl"></div>
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-blue-500/50 blur-[2px] animate-scan pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
