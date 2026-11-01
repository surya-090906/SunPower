import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { Camera, X } from "lucide-react";

export default function BarcodeScanner({ onDetected }) {
  const [open, setOpen] = useState(false),
    [device, setDevice] = useState(""),
    [devices, setDevices] = useState([]);
  const [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [detected, setDetected] = useState("");
  const video = useRef(null),
    latest = useRef(onDetected);
  latest.current = onDetected;
  useEffect(() => {
    if (!open) return;
    let cancelled = false,
      matched = false,
      stream,
      controls;
    const preview = video.current;
    const stop = () => {
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
      if (preview) preview.srcObject = null;
    };
    const hidden = () => {
      if (document.hidden) setOpen(false);
    };
    document.addEventListener("visibilitychange", hidden);
    setError("");
    setStatus("Starting camera…");
    setDetected("");
    async function start() {
      try {
        if (!window.isSecureContext)
          throw new Error(
            "Camera scanning needs HTTPS or localhost. Open the secure website, or enter the barcode manually.",
          );
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error(
            "Camera scanning is unavailable in this browser. You can enter the barcode manually.",
          );
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: device
            ? { deviceId: { exact: device } }
            : { facingMode: { ideal: "environment" } },
        });
        if (cancelled) {
          stop();
          return;
        }
        navigator.mediaDevices
          .enumerateDevices?.()
          .then((items) => {
            if (!cancelled)
              setDevices(items.filter((d) => d.kind === "videoinput"));
          })
          .catch(() => {});
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromStream(
          stream,
          preview,
          (result, decodeError, scanControls) => {
            if (cancelled || matched || !result) return;
            const code = result.getText().trim();
            if (!code) return;
            matched = true;
            scanControls?.stop();
            stream?.getTracks().forEach((track) => track.stop());
            setDetected(code);
            setOpen(false);
            latest.current(code);
          },
        );
        if (cancelled || matched) {
          stop();
          return;
        }
        setStatus(
          "Point the camera at the barcode or QR code. Keep the full label in view.",
        );
      } catch (e) {
        stop();
        if (cancelled) return;
        const messages = {
          NotAllowedError:
            "Camera permission was denied. Allow camera access in your browser, then try again.",
          NotFoundError:
            "No camera was found. Connect a camera or enter the barcode manually.",
          NotReadableError:
            "The camera is busy. Close other camera apps and try again.",
          OverconstrainedError:
            "This camera is unavailable. Choose another camera and try again.",
        };
        setError(
          messages[e.name] ||
            e.message ||
            "Could not start the camera. Try again or enter the barcode manually.",
        );
        setStatus("");
      }
    }
    start();
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", hidden);
      stop();
    };
  }, [open, device]);
  return (
    <Box>
      {!open && (
        <Button
          type="button"
          variant="outlined"
          startIcon={<Camera size={18} />}
          onClick={() => setOpen(true)}
        >
          Scan with camera
        </Button>
      )}
      {open && (
        <Box sx={{ p: 2, border: "1px solid #dfe6eb", borderRadius: 2 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>Barcode scanner</Typography>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              startIcon={<X size={16} />}
            >
              Stop camera
            </Button>
          </Stack>
          {devices.length > 1 && (
            <Box
              component="select"
              aria-label="Scanner camera"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              sx={{ width: "100%", p: 1, mb: 2 }}
            >
              <option value="">Automatic rear camera</option>
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </Box>
          )}
          <Box
            component="video"
            ref={video}
            aria-label="Live barcode camera"
            muted
            playsInline
            sx={{
              display: "block",
              width: "100%",
              maxHeight: 360,
              objectFit: "contain",
              bgcolor: "#172b3a",
              borderRadius: 1,
            }}
          />
          {status && (
            <Typography role="status" variant="body2" sx={{ mt: 1 }}>
              {status}
            </Typography>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Close scanner
              </Button>
            </Alert>
          )}
        </Box>
      )}
      {detected && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Detected: {detected}. Check the code and quantity, then select “Scan
          &amp; link”.
        </Alert>
      )}
    </Box>
  );
}
