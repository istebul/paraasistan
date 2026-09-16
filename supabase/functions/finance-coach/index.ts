import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_QUESTION_LENGTH = 1000;
const OPENAI_TIMEOUT_MS = 30_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    console.log("Finance coach başladı");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const supabaseKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl) {
      console.error("SUPABASE_URL bulunamadı");

      return new Response(
        JSON.stringify({
          error: "SUPABASE_URL bulunamadı",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!supabaseKey) {
      console.error("Supabase publishable/anon key bulunamadı");

      return new Response(
        JSON.stringify({
          error: "Supabase anahtarı bulunamadı",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Kullanıcının gönderdiği JWT
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      console.error("Authorization header bulunamadı");

      return new Response(
        JSON.stringify({
          error: "Oturum bilgisi bulunamadı",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Authorization bulundu");

    // Kullanıcı JWT'siyle Supabase client oluştur
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    // JWT'den kullanıcıyı doğrula
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(
        "Supabase kullanıcı doğrulama hatası:",
        userError.message
      );

      return new Response(
        JSON.stringify({
          error: `Kullanıcı doğrulanamadı: ${userError.message}`,
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!user) {
      console.error("Supabase kullanıcı döndürmedi");

      return new Response(
        JSON.stringify({
          error: "Kullanıcı bulunamadı",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userId = user.id;

    console.log("Kullanıcı doğrulandı:", userId);

    const { data: membership, error: membershipError } =
      await supabase
        .from("memberships")
        .select("plan, status")
        .eq("user_id", userId)
        .maybeSingle();

    if (membershipError) {
      console.error(
        "Membership doğrulama hatası:",
        membershipError.message
      );

      return new Response(
        JSON.stringify({
          error: "Üyelik bilgisi doğrulanamadı",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const hasActivePremium =
      membership?.plan === "premium" &&
      ["active", "trialing"].includes(
        membership.status
      );

    if (!hasActivePremium) {
      return new Response(
        JSON.stringify({
          error: "AI Finans Koçu premium üyelik gerektirir",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Kullanıcı sorusu
    const body = await req.json().catch(() => ({}));
    const requestedQuestion = body?.question;

    if (
      requestedQuestion !== undefined &&
      (typeof requestedQuestion !== "string" ||
        requestedQuestion.length > MAX_QUESTION_LENGTH)
    ) {
      return new Response(
        JSON.stringify({
          error: `Soru ${MAX_QUESTION_LENGTH} karakterden kısa olmalı`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const question =
      requestedQuestion?.trim() ||
      "Finansal durumumu analiz et ve bana uygulanabilir öneriler ver.";

    console.log("Finansal veriler getiriliyor");

    // Finansal verileri getir
    const [
      transactionsResult,
      goalsResult,
      subscriptionsResult,
      budgetResult,
    ] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false }),

      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId),

      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId),

      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (transactionsResult.error) {
      throw new Error(
        `Transactions hatası: ${transactionsResult.error.message}`
      );
    }

    if (goalsResult.error) {
      throw new Error(
        `Goals hatası: ${goalsResult.error.message}`
      );
    }

    if (subscriptionsResult.error) {
      throw new Error(
        `Subscriptions hatası: ${subscriptionsResult.error.message}`
      );
    }

    if (budgetResult.error) {
      throw new Error(
        `Budget hatası: ${budgetResult.error.message}`
      );
    }

    const transactions = transactionsResult.data || [];
    const goals = goalsResult.data || [];
    const subscriptions = subscriptionsResult.data || [];
    const budget = budgetResult.data || null;

    // Gelir
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // Gider
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (sum, t) => sum + Number(t.amount || 0),
        0
      );

    // Bakiye
    const balance = income - expense;

    // Kategori giderleri
    const categoryTotals: Record<string, number> = {};

    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;

      const category =
        transaction.category || "Diğer";

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(transaction.amount || 0);
    }

    // Hedefler
    const totalGoalTarget = goals.reduce(
      (sum, goal) =>
        sum + Number(goal.target || 0),
      0
    );

    const totalGoalSaved = goals.reduce(
      (sum, goal) =>
        sum + Number(goal.saved || 0),
      0
    );

    // Abonelikler
    const monthlySubscriptions =
      subscriptions.reduce(
        (sum, subscription) =>
          sum + Number(subscription.amount || 0),
        0
      );

    const financialSummary = {
      income,
      expense,
      balance,

      categoryTotals,

      goals: {
        count: goals.length,
        target: totalGoalTarget,
        saved: totalGoalSaved,
      },

      subscriptions: {
        count: subscriptions.length,
        monthlyTotal: monthlySubscriptions,
      },

      budget: budget
        ? Number(budget.amount || 0)
        : null,

      transactionCount:
        transactions.length,
    };

    console.log("Finansal özet hazır");

    // OpenAI API anahtarı
    const openaiKey =
      Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      console.error(
        "OPENAI_API_KEY bulunamadı"
      );

      return new Response(
        JSON.stringify({
          error:
            "OPENAI_API_KEY bulunamadı",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    console.log(
      "OpenAI API anahtarı bulundu"
    );

    // OpenAI
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      OPENAI_TIMEOUT_MS
    );

    let openaiResponse;

    try {
      openaiResponse = await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${openaiKey}`,
          },

          signal: controller.signal,

          body: JSON.stringify({
            model: "gpt-5-mini",

            input: [
              {
                role: "system",

                content:
                  "Sen ParaAsistan uygulamasının kişisel finans koçusun. Kullanıcının finansal verilerini analiz et. Türkçe, net, anlaşılır ve uygulanabilir öneriler ver. Yatırım tavsiyesi vermek yerine bütçe yönetimi, tasarruf, harcama kontrolü, hedefler ve finansal planlama konusunda yardımcı ol. Kullanıcının gerçek verilerine dayan. Rakamları doğru kullan.",
              },

              {
                role: "user",

                content: `
Kullanıcının finansal özeti:

${JSON.stringify(
  financialSummary,
  null,
  2
)}

Kullanıcının sorusu:

${question}

Bu verilere göre kullanıcıya kişiselleştirilmiş bir finansal değerlendirme yap.

Önce mevcut durumu kısa şekilde özetle.

Ardından en önemli 3-5 öneriyi ver.

Mümkünse rakamlarla konuş.

Cevabı Türkçe yaz.
                `,
              },
            ],
          }),
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return new Response(
          JSON.stringify({
            error: "AI servisi zamanında yanıt vermedi",
          }),
          {
            status: 504,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const responseText =
      await openaiResponse.text();

    console.log(
      "OpenAI HTTP status:",
      openaiResponse.status
    );

    // OpenAI hata verdi
    if (!openaiResponse.ok) {
      console.error(
        "OPENAI API HAM CEVAP:",
        responseText
      );

      let errorMessage =
        responseText;

      try {
        const errorJson =
          JSON.parse(responseText);

        errorMessage =
          errorJson?.error?.message ||
          errorJson?.message ||
          responseText;
      } catch {
        // Ham cevap kullanılacak
      }

      console.error(
        "OPENAI API HATASI:",
        errorMessage
      );

      return new Response(
        JSON.stringify({
          error: "AI servisi şu anda kullanılamıyor",
        }),
        {
          status: 502,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    console.log(
      "OpenAI cevabı başarıyla alındı"
    );

    let openaiData;

    try {
      openaiData =
        JSON.parse(responseText);
    } catch {
      console.error(
        "OpenAI JSON parse hatası:",
        responseText
      );

      return new Response(
        JSON.stringify({
          error:
            "OpenAI cevabı okunamadı",
        }),
        {
          status: 502,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // Responses API output_text
    let answer = "";

    if (
      typeof openaiData.output_text ===
      "string"
    ) {
      answer =
        openaiData.output_text;
    }

    // Alternatif output yapısı
    if (
      !answer &&
      Array.isArray(openaiData.output)
    ) {
      for (
        const item of openaiData.output
      ) {
        if (
          item?.type === "message" &&
          Array.isArray(item.content)
        ) {
          for (
            const content of item.content
          ) {
            if (
              content?.type ===
                "output_text" &&
              typeof content.text ===
                "string"
            ) {
              answer +=
                content.text;
            }
          }
        }
      }
    }

    if (!answer) {
      console.error(
        "OpenAI cevabında metin bulunamadı:",
        JSON.stringify(
          openaiData
        )
      );

      return new Response(
        JSON.stringify({
          error:
            "OpenAI cevabında metin bulunamadı",
        }),
        {
          status: 502,

          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    console.log(
      "AI finans koçu cevabı hazır"
    );

    return new Response(
      JSON.stringify({
        answer,
        summary:
          financialSummary,
      }),
      {
        status: 200,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    console.error(
      "FINANCE COACH GENEL HATA:",
      message
    );

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});