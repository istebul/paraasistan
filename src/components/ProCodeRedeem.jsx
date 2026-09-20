import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProCodeRedeem({
  visible,
  onRedeemed,
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] =
    useState("");
  const [successText, setSuccessText] =
    useState("");

  if (!visible) {
    return null;
  }

  const redeemCode = async (event) => {
    event.preventDefault();

    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setErrorText(
        "Lütfen Pro kodunu gir."
      );
      return;
    }

    setLoading(true);
    setErrorText("");
    setSuccessText("");

    try {
      const { data, error } =
        await supabase.rpc(
          "redeem_pro_access_code",
          {
            p_code: normalizedCode,
          }
        );

      if (
        error ||
        !data?.success
      ) {
        setErrorText(
          "Pro kodu kullanılamadı. Kodu kontrol edip tekrar dene."
        );
        return;
      }

      setCode("");
      setSuccessText(
        `Pro erişimin aktive edildi. Süre: ${data.duration_days} gün.`
      );

      await onRedeemed?.();
    } catch {
      setErrorText(
        "Pro kodu şu anda kullanılamıyor. Lütfen tekrar dene."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Pro Kodunu Kullan</h2>
          <p>
            Sana verilen tek kullanımlık Pro kodunu
            buradan hesabına tanımlayabilirsin.
          </p>
        </div>
      </div>

      <form
        className="pro-code-redeem-form"
        onSubmit={redeemCode}
      >
        <label>
          <span>Pro kodu</span>
          <input
            type="text"
            value={code}
            onChange={(event) =>
              setCode(event.target.value)
            }
            placeholder="PA-PRO-XXXX-XXXX-XXXX"
            autoComplete="off"
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading
            ? "Kontrol ediliyor..."
            : "Kodu Kullan"}
        </button>
      </form>

      {errorText && (
        <div
          style={{
            marginTop: "12px",
            color: "rgb(185, 28, 28)",
          }}
        >
          {errorText}
        </div>
      )}

      {successText && (
        <div
          style={{
            marginTop: "12px",
          }}
        >
          {successText}
        </div>
      )}
    </section>
  );
}
