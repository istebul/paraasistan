import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const invokeAdmin = async (action, payload = {}) => {
  const { data, error } = await supabase.functions.invoke(
    "admin-pro-access",
    {
      body: {
        action,
        ...payload,
      },
    }
  );

  if (error || !data?.success) {
    throw new Error(
      data?.error ||
        "Admin işlemi şu anda gerçekleştirilemiyor."
    );
  }

  return data;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
};

const getRemainingText = (
  expiresAt,
  currentTime
) => {
  if (!expiresAt) {
    return "Süresiz";
  }

  const remainingMs =
    new Date(expiresAt).getTime() - currentTime;

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return "Süresi doldu";
  }

  const totalHours = Math.floor(
    remainingMs / (1000 * 60 * 60)
  );

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `${days} gün ${hours} saat`;
  }

  return `${Math.max(hours, 1)} saat`;
};

const statusLabel = (status) => {
  const labels = {
    active: "Aktif",
    redeemed: "Kullanıldı",
    revoked: "İptal edildi",
    expired: "Süresi doldu",
    trialing: "Deneme",
    inactive: "Pasif",
    canceled: "İptal edildi",
  };

  return labels[status] || status || "-";
};

const featureLabels = {
  finance_coach: "AI Finans Koçu",
  advanced_reports: "Gelişmiş Raporlar",
  advanced_budget: "Gelişmiş Bütçe",
  premium_dashboard: "Premium Dashboard",
};

export default function AdminPanel({
  userCount,
}) {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [notice, setNotice] = useState("");
  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  const [targetUserId, setTargetUserId] =
    useState("");
  const [durationDays, setDurationDays] =
    useState("30");
  const [redeemDeadline, setRedeemDeadline] =
    useState("");
  const [features, setFeatures] = useState({
    finance_coach: true,
    advanced_reports: true,
    advanced_budget: true,
    premium_dashboard: true,
  });

  const [createdCode, setCreatedCode] =
    useState("");

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setErrorText("");

    try {
      const [
        overviewResult,
        usersResult,
        codesResult,
      ] = await Promise.all([
        invokeAdmin("overview"),
        invokeAdmin("list_users", {
          page: 1,
          per_page: 100,
        }),
        invokeAdmin("list_codes"),
      ]);

      setOverview({
        users: overviewResult.users || {},
        codes: overviewResult.codes || {},
        entitlements:
          overviewResult.entitlements || {},
      });
      setUsers(usersResult.users || []);
      setCodes(codesResult.codes || []);

      if (
        !targetUserId &&
        (usersResult.users || []).length > 0
      ) {
        setTargetUserId(
          usersResult.users[0].id
        );
      }
    } catch {
      setErrorText(
        "Admin verileri yüklenemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);
  useEffect(() => {
    const intervalId = window.setInterval(
      () => setCurrentTime(Date.now()),
      60 * 1000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);


  const selectedUser = useMemo(
    () =>
      users.find(
        (item) => item.id === targetUserId
      ) || null,
    [users, targetUserId]
  );

  const createCode = async (event) => {
    event.preventDefault();

    const parsedDuration = Number(
      durationDays
    );

    if (
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 3650
    ) {
      setErrorText(
        "Geçerli bir Pro süresi belirtmelisin."
      );
      return;
    }

    if (!targetUserId) {
      setErrorText(
        "Önce hedef kullanıcıyı seçmelisin."
      );
      return;
    }

    setSaving(true);
    setErrorText("");
    setNotice("");
    setCreatedCode("");

    try {
      const result = await invokeAdmin(
        "create_code",
        {
          target_user_id: targetUserId,
          duration_days: parsedDuration,
          redeem_deadline:
            redeemDeadline
              ? new Date(
                  redeemDeadline
                ).toISOString()
              : null,
          features,
        }
      );

      setCreatedCode(result.code || "");
      setNotice(
        "Pro kodu oluşturuldu. Güvenlik nedeniyle kod yalnızca bu ekranda gösterilir."
      );

      setCodes((current) => [
        {
          ...result.code_record,
          entitlement: null,
        },
        ...current,
      ]);
    } catch {
      setErrorText(
        "Pro kodu oluşturulamadı. Lütfen bilgileri kontrol et."
      );
    } finally {
      setSaving(false);
    }
  };

  const revokeCode = async (codeId) => {
    if (
      !window.confirm(
        "Bu kullanılmamış Pro kodunu iptal etmek istediğine emin misin?"
      )
    ) {
      return;
    }

    setSaving(true);
    setErrorText("");
    setNotice("");

    try {
      await invokeAdmin("revoke_code", {
        code_id: codeId,
        reason:
          "Admin Panel üzerinden kod iptali",
      });

      setNotice("Pro kodu iptal edildi.");
      await loadAdminData();
    } catch {
      setErrorText(
        "Pro kodu iptal edilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const revokeEntitlement = async (
    entitlementId
  ) => {
    if (
      !window.confirm(
        "Bu kullanıcının Pro erişimini iptal etmek istediğine emin misin?"
      )
    ) {
      return;
    }

    setSaving(true);
    setErrorText("");
    setNotice("");

    try {
      await invokeAdmin(
        "revoke_entitlement",
        {
          entitlement_id: entitlementId,
          reason:
            "Admin Panel üzerinden Pro erişimi iptali",
        }
      );

      setNotice(
        "Pro erişimi iptal edildi."
      );
      await loadAdminData();
    } catch {
      setErrorText(
        "Pro erişimi iptal edilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="card admin-card">
        <div className="card-header">
          <div>
            <h2>Yönetim Paneli</h2>
            <p>Admin verileri yükleniyor...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="admin-panel">
      {(errorText || notice) && (
        <section
          className="card"
          style={{
            border:
              errorText
                ? "1px solid rgba(220, 38, 38, .25)"
                : "1px solid rgba(34, 197, 94, .25)",
          }}
        >
          <strong>
            {errorText || notice}
          </strong>
        </section>
      )}

      <section className="card admin-card">
        <div className="card-header">
          <div>
            <h2>Yönetim Özeti</h2>
            <p>
              Kullanıcılar ve Pro erişimleri
              hakkında genel görünüm.
            </p>
          </div>
        </div>

        <div className="admin-stat-grid">
          <div className="stat-card">
            <span>Toplam Kullanıcı</span>
            <strong>
              {overview?.users?.visible ??
                userCount ??
                0}
            </strong>
          </div>

          <div className="stat-card">
            <span>Aktif Kod</span>
            <strong>
              {overview?.codes?.active || 0}
            </strong>
          </div>

          <div className="stat-card">
            <span>Kullanılan Kod</span>
            <strong>
              {overview?.codes?.redeemed || 0}
            </strong>
          </div>

          <div className="stat-card">
            <span>Aktif Pro Erişimi</span>
            <strong>
              {overview?.entitlements?.active ||
                0}
            </strong>
          </div>
        </div>
      </section>

      <section className="card admin-card">
        <div className="card-header">
          <div>
            <h2>Pro Kodu Oluştur</h2>
            <p>
              Belirli bir kullanıcıya tek kullanımlık
              Pro erişimi tanımla.
            </p>
          </div>
        </div>

        <form
          className="admin-form"
          onSubmit={createCode}
        >
          <label>
            <span>Hedef kullanıcı</span>
            <select
              value={targetUserId}
              onChange={(event) =>
                setTargetUserId(
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option value="">
                Kullanıcı seç
              </option>
              {users.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.email}
                  {item.is_premium
                    ? " — Pro"
                    : " — Standart"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Pro süresi</span>
            <select
              value={durationDays}
              onChange={(event) =>
                setDurationDays(
                  event.target.value
                )
              }
              disabled={saving}
            >
              <option value="7">7 gün</option>
              <option value="30">30 gün</option>
              <option value="90">90 gün</option>
              <option value="180">180 gün</option>
              <option value="365">365 gün</option>
              <option value="730">730 gün</option>
            </select>
          </label>

          <label>
            <span>
              Kodun kullanılabileceği son tarih
            </span>
            <input
              type="datetime-local"
              value={redeemDeadline}
              onChange={(event) =>
                setRedeemDeadline(
                  event.target.value
                )
              }
              disabled={saving}
            />
          </label>

          <div>
            <strong>Pro özellikleri</strong>

            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {Object.entries(
                featureLabels
              ).map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      features[key] === true
                    }
                    onChange={(event) =>
                      setFeatures((current) => ({
                        ...current,
                        [key]:
                          event.target.checked,
                      }))
                    }
                    disabled={saving}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedUser && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "12px",
                background:
                  "rgba(99,102,241,.06)",
              }}
            >
              <strong>
                {selectedUser.email}
              </strong>
              <div
                style={{
                  marginTop: "5px",
                  opacity: 0.75,
                }}
              >
                {selectedUser.is_premium
                  ? "Mevcut Pro erişimi var"
                  : "Standart kullanıcı"}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "İşleniyor..."
              : "Pro Kodu Oluştur"}
          </button>
        </form>

        {createdCode && (
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "14px",
              border:
                "1px solid rgba(99,102,241,.25)",
              background:
                "rgba(99,102,241,.06)",
            }}
          >
            <strong>Yeni Pro Kodu</strong>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: "10px",
              }}
            >
              <code
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                }}
              >
                {createdCode}
              </code>

              <button
                type="button"
                className="secondary-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      createdCode
                    );
                    setNotice(
                      "Pro kodu panoya kopyalandı."
                    );
                  } catch {
                    setNotice(
                      "Kopyalama başarısız oldu; kodu elle kopyalayabilirsin."
                    );
                  }
                }}
              >
                Kopyala
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card admin-card">
        <div className="card-header">
          <div>
            <h2>Kullanıcılar</h2>
            <p>
              Standart ve Pro kullanıcıların mevcut
              durumlarını takip et.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {users.map((item) => {
            const membership =
              item.membership || null;
            const entitlement =
              item.entitlement || null;

            return (
              <div
                key={item.id}
                className="admin-user-row"
              >
                <div>
                  <strong>
                    {item.email || "-"}
                  </strong>
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      opacity: 0.65,
                    }}
                  >
                    Kayıt:{" "}
                    {formatDate(
                      item.created_at
                    )}
                  </div>
                </div>

                <div>
                  <strong>
                    {item.is_premium
                      ? "Pro"
                      : "Standart"}
                  </strong>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    {statusLabel(
                      membership?.status
                    )}
                  </div>
                </div>

                <div>
                  <div>
                    {membership?.expires_at
                      ? `Bitiş: ${formatDate(
                          membership.expires_at
                        )}`
                      : item.is_premium
                        ? "Süresiz erişim"
                        : "Aktif Pro yok"}
                  </div>
                  {entitlement?.expires_at && (
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.7,
                        marginTop: "4px",
                      }}
                    >
                      Kod kalan:{" "}
                      {getRemainingText(
                        entitlement.expires_at,
                        currentTime
                      )}
                    </div>
                  )}
                </div>

                {entitlement?.status ===
                  "active" && (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() =>
                      revokeEntitlement(
                        entitlement.id
                      )
                    }
                    disabled={saving}
                  >
                    Pro'yu İptal Et
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card admin-card">
        <div className="card-header">
          <div>
            <h2>Pro Kod Geçmişi</h2>
            <p>
              Oluşturulan kodları, kullanım durumlarını
              ve Pro erişim sürelerini takip et.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {codes.length === 0 && (
            <div
              style={{
                padding: "20px 0",
                opacity: 0.7,
              }}
            >
              Henüz Pro kodu oluşturulmadı.
            </div>
          )}

          {codes.map((code) => {
            const entitlement =
              code.entitlement || null;

            let remainingText = "-";

            if (
              entitlement?.status ===
              "active"
            ) {
              remainingText =
                getRemainingText(
                  entitlement.expires_at,
                  currentTime
                );
            } else if (
              code.status === "active"
            ) {
              remainingText = `${code.duration_days} gün Pro`;
            }

            return (
              <div
                key={code.id}
                className="admin-code-row"
              >
                <div>
                  <strong>{code.code_hint}</strong>
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "12px",
                      opacity: 0.65,
                    }}
                  >
                    {formatDate(code.created_at)}
                  </div>
                </div>

                <div>
                  <strong>
                    {code.target_email ||
                      code.target_user_id ||
                      "-"}
                  </strong>
                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    {code.duration_days} gün
                  </div>
                </div>

                <div>
                  {statusLabel(code.status)}
                </div>

                <div>
                  <strong>
                    {remainingText}
                  </strong>
                  {code.redeemed_at && (
                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.7,
                        marginTop: "4px",
                      }}
                    >
                      Kullanım:{" "}
                      {formatDate(
                        code.redeemed_at
                      )}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {code.status ===
                    "active" && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        revokeCode(code.id)
                      }
                      disabled={saving}
                    >
                      Kodu İptal Et
                    </button>
                  )}

                  {entitlement?.status ===
                    "active" && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        revokeEntitlement(
                          entitlement.id
                        )
                      }
                      disabled={saving}
                    >
                      Pro'yu İptal Et
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
