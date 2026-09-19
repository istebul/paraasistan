import { useEffect, useState } from "react";

const isIosDevice = () => {
  const userAgent = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";

  return (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
};

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches ||
  window.navigator.standalone === true;

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowIosHint(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    if (isIosDevice()) {
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    const promptEvent = deferredPrompt;
    setDeferredPrompt(null);

    await promptEvent.prompt();
    await promptEvent.userChoice;
  };

  if (deferredPrompt) {
    return (
      <div
        style={{
          position: "fixed",
          left: "16px",
          right: "16px",
          bottom: "16px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 16px",
          border: "1px solid rgba(185, 204, 228, 0.16)",
          borderRadius: "16px",
          background: "rgba(20, 28, 39, 0.96)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div>
          <strong style={{ display: "block" }}>
            ParaAsistan'ı yükle
          </strong>
          <span
            style={{
              display: "block",
              marginTop: "3px",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            Uygulama gibi hızlıca aç.
          </span>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={installApp}
        >
          Uygulamayı Yükle
        </button>
      </div>
    );
  }

  if (showIosHint) {
    return (
      <div
        style={{
          position: "fixed",
          left: "16px",
          right: "16px",
          bottom: "16px",
          zIndex: 9999,
          padding: "14px 16px",
          border: "1px solid rgba(185, 204, 228, 0.16)",
          borderRadius: "16px",
          background: "rgba(20, 28, 39, 0.96)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
          backdropFilter: "blur(14px)",
          color: "var(--text-muted)",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--text)" }}>
          ParaAsistan'ı ana ekrana ekle
        </strong>
        <br />
        Safari'de <strong>Paylaş</strong> →{" "}
        <strong>Ana Ekrana Ekle</strong> seçeneğini kullan.
      </div>
    );
  }

  return null;
}
