import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY"
);

if (
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  !SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error("Supabase ortam değişkenleri eksik.");
}

const PRODUCTION_ORIGIN =
  "https://paraasistan.istebul.com";

const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
]);

const isAllowedLocalNetworkOrigin = (
  origin: string | null
) => {
  if (!origin) return false;

  try {
    const parsed = new URL(origin);

    if (
      parsed.protocol !== "http:" ||
      !/^517[3-8]$/.test(
        parsed.port || ""
      )
    ) {
      return false;
    }

    return /^192\.168\.\d{1,3}\.\d{1,3}$/.test(
      parsed.hostname
    );
  } catch {
    return false;
  }
};

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin =
    origin === PRODUCTION_ORIGIN ||
    (
      origin !== null &&
      (
        LOCAL_ORIGINS.has(origin) ||
        isAllowedLocalNetworkOrigin(origin)
      )
    )
      ? origin
      : null;

  return {
    ...(allowedOrigin
      ? {
          "Access-Control-Allow-Origin":
            allowedOrigin,
        }
      : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "POST, OPTIONS",
    Vary: "Origin",
  };
};

const jsonResponse = (
  body: unknown,
  status = 200,
  corsHeaders: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });


const sha256Hex = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
};

const CODE_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateCode = () => {
  const values = new Uint8Array(12);
  crypto.getRandomValues(values);

  const chars = Array.from(values, (value) =>
    CODE_ALPHABET[value % CODE_ALPHABET.length]
  );

  return `PA-PRO-${chars
    .slice(0, 4)
    .join("")}-${chars
    .slice(4, 8)
    .join("")}-${chars
    .slice(8, 12)
    .join("")}`;
};

const normalizeFeatures = (
  input: unknown
) => {
  const source =
    input &&
    typeof input === "object" &&
    !Array.isArray(input)
      ? input as Record<string, unknown>
      : {};

  return {
    finance_coach:
      source.finance_coach !== false,
    advanced_reports:
      source.advanced_reports !== false,
    advanced_budget:
      source.advanced_budget !== false,
    premium_dashboard:
      source.premium_dashboard !== false,
  };
};

const findUserByEmail = async (
  adminClient: ReturnType<typeof createClient>,
  email: string
) => {
  const normalizedEmail =
    email.trim().toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } =
      await adminClient.auth.admin.listUsers({
        page,
        perPage: 100,
      });

    if (error) throw error;

    const match = data.users.find(
      (user) =>
        user.email?.toLowerCase() ===
        normalizedEmail
    );

    if (match) return match;

    if (data.users.length < 100) break;
  }

  return null;
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(
    req.headers.get("Origin")
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Yalnızca POST isteği kabul edilir." },
      405,
      corsHeaders
    );
  }

  try {
    const authorization =
      req.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        { error: "Yetkilendirme gerekli." },
        401,
        corsHeaders
      );
    }

    const authClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      console.error(
        "Admin kullanıcı doğrulama hatası:",
        userError
      );

      return jsonResponse(
        { error: "Kullanıcı doğrulanamadı." },
        401,
        corsHeaders
      );
    }

    const adminClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: adminRecord, error: adminError } =
      await adminClient
        .from("admin_users")
        .select("user_id, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
      adminError ||
      !adminRecord ||
      adminRecord.is_active !== true
    ) {
      if (adminError) {
        console.error(
          "Admin yetki kontrolü hatası:",
          adminError
        );
      }

      return jsonResponse(
        { error: "Admin yetkisi gerekli." },
        403,
        corsHeaders
      );
    }

    let payload: Record<string, unknown>;

    try {
      payload = await req.json();
    } catch {
      return jsonResponse(
        { error: "Geçersiz istek verisi." },
        400,
        corsHeaders
      );
    }

    const action =
      typeof payload.action === "string"
        ? payload.action
        : "";

    if (action === "create_code") {
      const durationDays = Number(
        payload.duration_days
      );

      if (
        !Number.isInteger(durationDays) ||
        durationDays < 1 ||
        durationDays > 3650
      ) {
        return jsonResponse(
          {
            error:
              "Geçerli bir Pro süresi belirtmelisin.",
          },
          400,
          corsHeaders
        );
      }

      const targetUserId =
        typeof payload.target_user_id ===
        "string"
          ? payload.target_user_id.trim()
          : "";

      const targetEmail =
        typeof payload.target_email ===
        "string"
          ? payload.target_email.trim()
          : "";

      if (!targetUserId && !targetEmail) {
        return jsonResponse(
          {
            error:
              "Hedef kullanıcı belirtilmelidir.",
          },
          400,
          corsHeaders
        );
      }

      let targetUser:
        | Awaited<
            ReturnType<
              typeof adminClient.auth.admin.getUserById
            >
          >["data"]["user"]
        | null = null;

      if (targetUserId) {
        const { data, error } =
          await adminClient.auth.admin.getUserById(
            targetUserId
          );

        if (error || !data.user) {
          return jsonResponse(
            {
              error:
                "Hedef kullanıcı bulunamadı.",
            },
            404,
            corsHeaders
          );
        }

        targetUser = data.user;
      } else {
        targetUser =
          await findUserByEmail(
            adminClient,
            targetEmail
          );

        if (!targetUser) {
          return jsonResponse(
            {
              error:
                "Hedef kullanıcı bulunamadı.",
            },
            404,
            corsHeaders
          );
        }
      }

      const normalizedTargetEmail =
        targetUser.email?.trim() ||
        targetEmail ||
        null;

      let redeemDeadline:
        | string
        | null = null;

      if (
        typeof payload.redeem_deadline ===
        "string" &&
        payload.redeem_deadline.trim()
      ) {
        const parsed = new Date(
          payload.redeem_deadline
        );

        if (
          Number.isNaN(parsed.getTime()) ||
          parsed <= new Date()
        ) {
          return jsonResponse(
            {
              error:
                "Geçerli bir kod kullanım son tarihi belirtmelisin.",
            },
            400,
            corsHeaders
          );
        }

        redeemDeadline =
          parsed.toISOString();
      }

      const features = normalizeFeatures(
        payload.features
      );

      let plainCode = "";
      let codeHash = "";

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = generateCode();
        const candidateHash =
          await sha256Hex(candidate);

        const { data: existing } =
          await adminClient
            .from("pro_access_codes")
            .select("id")
            .eq("code_hash", candidateHash)
            .maybeSingle();

        if (!existing) {
          plainCode = candidate;
          codeHash = candidateHash;
          break;
        }
      }

      if (!plainCode || !codeHash) {
        throw new Error(
          "Güvenli Pro kodu üretilemedi."
        );
      }

      const codeHint =
        `${plainCode.slice(0, 11)}...`;

      const {
        data: insertedCode,
        error: insertError,
      } = await adminClient
        .from("pro_access_codes")
        .insert({
          code_hash: codeHash,
          code_hint: codeHint,
          target_user_id: targetUser.id,
          target_email: normalizedTargetEmail,
          plan: "premium",
          duration_days: durationDays,
          features,
          redeem_deadline: redeemDeadline,
          status: "active",
          created_by: user.id,
        })
        .select(
          "id, code_hint, target_user_id, target_email, plan, duration_days, features, redeem_deadline, status, created_at"
        )
        .single();

      if (insertError || !insertedCode) {
        console.error(
          "Pro kodu oluşturma hatası:",
          insertError
        );

        return jsonResponse(
          {
            error:
              "Pro kodu oluşturulamadı.",
          },
          500,
          corsHeaders
        );
      }

      const { error: auditError } =
        await adminClient
          .from("admin_audit_logs")
          .insert({
            admin_user_id: user.id,
            action: "create_pro_code",
            access_code_id: insertedCode.id,
            target_user_id: targetUser.id,
            metadata: {
              plan: insertedCode.plan,
              duration_days:
                insertedCode.duration_days,
              features: insertedCode.features,
              redeem_deadline:
                insertedCode.redeem_deadline,
            },
          });

      if (auditError) {
        console.error(
          "Admin audit kaydı hatası:",
          auditError
        );
      }

      return jsonResponse(
        {
          success: true,
          code: plainCode,
          code_record: insertedCode,
        },
        201,
        corsHeaders
      );
    }

    if (action === "list_codes") {
      const { data: codeRows, error: codesError } =
        await adminClient
          .from("pro_access_codes")
          .select(
            "id, code_hint, target_user_id, target_email, plan, duration_days, features, redeem_deadline, status, redeemed_by, redeemed_at, membership_id, revoked_by, revoked_at, revoke_reason, created_by, created_at"
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(500);

      if (codesError) {
        console.error(
          "Pro kodları listeleme hatası:",
          codesError
        );
        return jsonResponse(
          {
            error:
              "Pro kodları yüklenemedi.",
          },
          500,
          corsHeaders
        );
      }

      const codeIds = (codeRows || []).map(
        (item) => item.id
      );

      let entitlementRows: Array<{
        id: string;
        user_id: string;
        access_code_id: string;
        plan: string;
        features: Record<string, unknown> | null;
        starts_at: string | null;
        expires_at: string | null;
        status: string;
        membership_id: number | null;
      }> = [];

      if (codeIds.length > 0) {
        const {
          data,
          error: entitlementError,
        } = await adminClient
          .from("pro_entitlements")
          .select(
            "id, user_id, access_code_id, plan, features, starts_at, expires_at, status, membership_id"
          )
          .in("access_code_id", codeIds);

        if (entitlementError) {
          console.error(
            "Pro entitlement listeleme hatası:",
            entitlementError
          );
          return jsonResponse(
            {
              error:
                "Pro erişim kayıtları yüklenemedi.",
            },
            500,
            corsHeaders
          );
        }

        entitlementRows = data || [];
      }

      const entitlementByCode = new Map(
        entitlementRows.map((item) => [
          item.access_code_id,
          item,
        ])
      );

      return jsonResponse(
        {
          success: true,
          codes: (codeRows || []).map((item) => ({
            ...item,
            entitlement:
              entitlementByCode.get(item.id) || null,
          })),
        },
        200,
        corsHeaders
      );
    }

    if (action === "list_users") {
      const page = Math.max(
        1,
        Number(payload.page) || 1
      );
      const perPage = Math.min(
        100,
        Math.max(
          1,
          Number(payload.per_page) || 50
        )
      );
      const {
        data,
        error,
      } =
        await adminClient.auth.admin.listUsers({
          page,
          perPage,
        });

      if (error) {
        console.error(
          "Kullanıcı listesi hatası:",
          error
        );
        return jsonResponse(
          {
            error:
              "Kullanıcılar yüklenemedi.",
          },
          500,
          corsHeaders
        );
      }

      const users = data.users || [];
      const userIds = users.map(
        (item) => item.id
      );

      let memberships: Array<Record<string, unknown>> = [];
      let entitlements: Array<Record<string, unknown>> = [];

      if (userIds.length > 0) {
        const [
          membershipsResult,
          entitlementsResult,
        ] = await Promise.all([
          adminClient
            .from("memberships")
            .select(
              "id, user_id, plan, status, started_at, starts_at, expires_at, source, access_code_id"
            )
            .in("user_id", userIds),
          adminClient
            .from("pro_entitlements")
            .select(
              "id, user_id, access_code_id, plan, features, starts_at, expires_at, status, membership_id"
            )
            .in("user_id", userIds),
        ]);

        if (membershipsResult.error) {
          console.error(
            "Admin üyelik listesi hatası:",
            membershipsResult.error
          );
          return jsonResponse(
            {
              error:
                "Üyelik bilgileri yüklenemedi.",
            },
            500,
            corsHeaders
          );
        }

        if (entitlementsResult.error) {
          console.error(
            "Admin entitlement listesi hatası:",
            entitlementsResult.error
          );
          return jsonResponse(
            {
              error:
                "Pro erişim bilgileri yüklenemedi.",
            },
            500,
            corsHeaders
          );
        }

        memberships =
          membershipsResult.data || [];
        entitlements =
          entitlementsResult.data || [];
      }

      const membershipByUser = new Map(
        memberships.map((item) => [
          item.user_id,
          item,
        ])
      );

      const now = Date.now();

      const activeEntitlementByUser = new Map<
        string,
        Record<string, unknown>
      >();

      for (const entitlement of entitlements) {
        const status =
          typeof entitlement.status === "string"
            ? entitlement.status
            : "";

        const expiresAt =
          typeof entitlement.expires_at === "string"
            ? entitlement.expires_at
            : null;

        const notExpired =
          !expiresAt ||
          new Date(expiresAt).getTime() > now;

        if (
          status === "active" &&
          notExpired &&
          !activeEntitlementByUser.has(
            String(entitlement.user_id)
          )
        ) {
          activeEntitlementByUser.set(
            String(entitlement.user_id),
            entitlement
          );
        }
      }

      return jsonResponse(
        {
          success: true,
          page,
          per_page: perPage,
          users: users.map((item) => {
            const membership =
              membershipByUser.get(item.id) ||
              null;

            const entitlement =
              activeEntitlementByUser.get(item.id) ||
              null;

            const membershipExpiry =
              typeof membership?.expires_at ===
              "string"
                ? membership.expires_at
                : null;

            const membershipActive =
              membership?.plan === "premium" &&
              ["active", "trialing"].includes(
                String(membership?.status || "")
              ) &&
              (
                !membershipExpiry ||
                new Date(
                  membershipExpiry
                ).getTime() > now
              );

            return {
              id: item.id,
              email: item.email,
              created_at: item.created_at,
              last_sign_in_at:
                item.last_sign_in_at || null,
              membership,
              entitlement,
              is_premium:
                membershipActive ||
                Boolean(entitlement),
            };
          }),
        },
        200,
        corsHeaders
      );
    }

    if (action === "overview") {
      const [
        usersResult,
        codesResult,
        entitlementsResult,
      ] = await Promise.all([
        adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        }),
        adminClient
          .from("pro_access_codes")
          .select("status", {
            count: "exact",
            head: false,
          }),
        adminClient
          .from("pro_entitlements")
          .select("status", {
            count: "exact",
            head: false,
          }),
      ]);

      if (usersResult.error) {
        console.error(
          "Admin kullanıcı özeti hatası:",
          usersResult.error
        );
      }

      if (codesResult.error) {
        console.error(
          "Admin kod özeti hatası:",
          codesResult.error
        );
      }

      if (entitlementsResult.error) {
        console.error(
          "Admin erişim özeti hatası:",
          entitlementsResult.error
        );
      }

      const countByStatus = (
        rows: Array<{ status: string }> | null
      ) =>
        (rows || []).reduce<
          Record<string, number>
        >((result, row) => {
          result[row.status] =
            (result[row.status] || 0) + 1;
          return result;
        }, {});

      return jsonResponse(
        {
          success: true,
          users: {
            visible:
              usersResult.data?.users
                ?.length || 0,
            has_more:
              (usersResult.data?.users
                ?.length || 0) >= 100,
          },
          codes: countByStatus(
            codesResult.data
          ),
          entitlements:
            countByStatus(
              entitlementsResult.data
            ),
        },
        200,
        corsHeaders
      );
    }

    if (action === "revoke_code") {
      const codeId =
        typeof payload.code_id === "string"
          ? payload.code_id.trim()
          : "";

      const reason =
        typeof payload.reason === "string"
          ? payload.reason.trim().slice(0, 500)
          : null;

      if (!codeId) {
        return jsonResponse(
          {
            error:
              "İptal edilecek Pro kodu belirtilmelidir.",
          },
          400,
          corsHeaders
        );
      }

      const {
        data: codeRecord,
        error: codeError,
      } = await adminClient
        .from("pro_access_codes")
        .select(
          "id, target_user_id, target_email, status, redeemed_by, redeemed_at"
        )
        .eq("id", codeId)
        .maybeSingle();

      if (codeError || !codeRecord) {
        if (codeError) {
          console.error(
            "Pro kodu sorgu hatası:",
            codeError
          );
        }

        return jsonResponse(
          {
            error:
              "Pro kodu bulunamadı.",
          },
          404,
          corsHeaders
        );
      }

      if (codeRecord.status !== "active") {
        return jsonResponse(
          {
            error:
              "Bu Pro kodu artık iptal edilemez.",
          },
          409,
          corsHeaders
        );
      }

      const { data: revokedCode, error: revokeError } =
        await adminClient
          .from("pro_access_codes")
          .update({
            status: "revoked",
            revoked_by: user.id,
            revoked_at: new Date().toISOString(),
            revoke_reason: reason,
          })
          .eq("id", codeId)
          .eq("status", "active")
          .select(
            "id, code_hint, target_user_id, target_email, status, revoked_at, revoke_reason"
          )
          .single();

      if (revokeError || !revokedCode) {
        console.error(
          "Pro kodu iptal hatası:",
          revokeError
        );

        return jsonResponse(
          {
            error:
              "Pro kodu iptal edilemedi.",
          },
          500,
          corsHeaders
        );
      }

      const { error: auditError } =
        await adminClient
          .from("admin_audit_logs")
          .insert({
            admin_user_id: user.id,
            action: "revoke_pro_code",
            access_code_id: codeId,
            target_user_id:
              codeRecord.target_user_id,
            metadata: {
              target_email:
                codeRecord.target_email,
              reason,
              previous_status:
                codeRecord.status,
            },
          });

      if (auditError) {
        console.error(
          "Admin audit kayıt hatası:",
          auditError
        );
      }

      return jsonResponse(
        {
          success: true,
          code: revokedCode,
        },
        200,
        corsHeaders
      );
    }

    if (action === "revoke_entitlement") {
      const entitlementId =
        typeof payload.entitlement_id ===
        "string"
          ? payload.entitlement_id.trim()
          : "";

      const reason =
        typeof payload.reason === "string"
          ? payload.reason.trim().slice(0, 500)
          : null;

      if (!entitlementId) {
        return jsonResponse(
          {
            error:
              "İptal edilecek Pro erişimi belirtilmelidir.",
          },
          400,
          corsHeaders
        );
      }

      const {
        data: entitlement,
        error: entitlementError,
      } = await adminClient
        .from("pro_entitlements")
        .select(
          "id, user_id, access_code_id, status, expires_at"
        )
        .eq("id", entitlementId)
        .maybeSingle();

      if (
        entitlementError ||
        !entitlement
      ) {
        if (entitlementError) {
          console.error(
            "Pro erişim sorgu hatası:",
            entitlementError
          );
        }

        return jsonResponse(
          {
            error:
              "Pro erişimi bulunamadı.",
          },
          404,
          corsHeaders
        );
      }

      const { data: result, error: revokeError } =
        await adminClient.rpc(
          "revoke_pro_entitlement",
          {
            p_entitlement_id:
              entitlementId,
            p_admin_user_id: user.id,
            p_reason: reason,
          }
        );

      if (revokeError) {
        console.error(
          "Pro erişim iptal hatası:",
          revokeError
        );

        return jsonResponse(
          {
            error:
              "Pro erişimi iptal edilemedi.",
          },
          500,
          corsHeaders
        );
      }

      const { error: auditError } =
        await adminClient
          .from("admin_audit_logs")
          .insert({
            admin_user_id: user.id,
            action: "revoke_pro_entitlement",
            access_code_id:
              entitlement.access_code_id,
            target_user_id:
              entitlement.user_id,
            metadata: {
              reason,
              previous_status:
                entitlement.status,
              previous_expires_at:
                entitlement.expires_at,
              result,
            },
          });

      if (auditError) {
        console.error(
          "Admin audit kayıt hatası:",
          auditError
        );
      }

      return jsonResponse(
        {
          success: true,
          result,
        },
        200,
        corsHeaders
      );
    }

    return jsonResponse(
      {
        error: "Geçersiz admin işlemi.",
      },
      400,
      corsHeaders
    );
  } catch (error) {
    console.error(
      "ADMIN PRO ACCESS GENEL HATA:",
      error
    );

    return jsonResponse(
      {
        error:
          "Admin işlemi şu anda gerçekleştirilemiyor. Lütfen tekrar deneyin.",
      },
      500,
      corsHeaders
    );
  }
});
