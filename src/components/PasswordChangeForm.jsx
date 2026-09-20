import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function PasswordChangeForm() {
  const [form, setForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [errorText, setErrorText] =
    useState("");

  const changePassword = async (event) => {
    event.preventDefault();

    setMessage("");
    setErrorText("");

    const currentPassword =
      form.current;
    const nextPassword =
      form.next;
    const confirmPassword =
      form.confirm;

    if (
      !currentPassword ||
      !nextPassword ||
      !confirmPassword
    ) {
      setErrorText(
        "Tüm şifre alanlarını doldurmalısın."
      );
      return;
    }

    if (nextPassword.length < 8) {
      setErrorText(
        "Yeni şifre en az 8 karakter olmalı."
      );
      return;
    }

    if (
      nextPassword !==
      confirmPassword
    ) {
      setErrorText(
        "Yeni şifre ve tekrarı eşleşmiyor."
      );
      return;
    }

    if (
      currentPassword ===
      nextPassword
    ) {
      setErrorText(
        "Yeni şifre mevcut şifrenle aynı olamaz."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getUser();

      const email =
        sessionData.user?.email || "";

      if (sessionError || !email) {
        setErrorText(
          "Oturum bilgileri alınamadı. Lütfen tekrar giriş yap."
        );
        return;
      }

      const {
        error: verifyError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password:
            currentPassword,
        });

      if (verifyError) {
        setErrorText(
          "Mevcut şifre doğrulanamadı."
        );
        return;
      }

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password: nextPassword,
          current_password:
            currentPassword,
        });

      if (updateError) {
        console.error(
          "Şifre güncellenemedi:",
          updateError
        );

        setErrorText(
          "Şifre değiştirilemedi. Lütfen şifrenin gereksinimlerini kontrol et."
        );
        return;
      }

      setForm({
        current: "",
        next: "",
        confirm: "",
      });

      setMessage(
        "Şifren başarıyla değiştirildi."
      );
    } catch (error) {
      console.error(
        "Şifre değiştirme hatası:",
        error
      );

      setErrorText(
        "Şifre değiştirilemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel password-panel">
      <div className="panel-header">
        <div>
          <h2>Şifre Değiştir</h2>
          <p>
            Hesabının giriş şifresini
            güvenli şekilde güncelle.
          </p>
        </div>
      </div>

      <form
        onSubmit={changePassword}
        className="form-grid"
      >
        <label>
          Mevcut Şifre
          <input
            type="password"
            value={form.current}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                current:
                  event.target.value,
              }))
            }
            autoComplete="current-password"
            placeholder="Mevcut şifren"
            disabled={loading}
          />
        </label>

        <label>
          Yeni Şifre
          <input
            type="password"
            value={form.next}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                next:
                  event.target.value,
              }))
            }
            autoComplete="new-password"
            minLength={8}
            placeholder="En az 8 karakter"
            disabled={loading}
          />
        </label>

        <label>
          Yeni Şifre Tekrar
          <input
            type="password"
            value={form.confirm}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                confirm:
                  event.target.value,
              }))
            }
            autoComplete="new-password"
            minLength={8}
            placeholder="Yeni şifreni tekrar yaz"
            disabled={loading}
          />
        </label>

        <button
          type="submit"
          className="secondary-button"
          disabled={loading}
        >
          {loading
            ? "Şifre değiştiriliyor..."
            : "Şifreyi Değiştir"}
        </button>
      </form>

      {errorText && (
        <div
          className="error-box"
          style={{
            marginTop: "12px",
          }}
        >
          {errorText}
        </div>
      )}

      {message && (
        <div
          className="success-box"
          style={{
            marginTop: "12px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
