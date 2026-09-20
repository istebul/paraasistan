import { createClient } from "npm:@supabase/supabase-js@2";

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

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin =
    origin === PRODUCTION_ORIGIN ||
    (origin !== null && LOCAL_ORIGINS.has(origin))
      ? origin
      : null;

  return {
    ...(allowedOrigin
      ? { "Access-Control-Allow-Origin": allowedOrigin }
      : {}),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "POST, OPTIONS",
    Vary: "Origin",
  };
};

const MAX_QUESTION_LENGTH = 1000;
const OPENAI_TIMEOUT_MS = 30_000;

const LEGAL_NOTICE =
  "ParaAsistan AI tarafından sunulan bilgiler genel bilgilendirme ve finansal eğitim amaçlıdır. Yatırım danışmanlığı, kişiye özel yatırım tavsiyesi veya yatırım işlemi emri değildir. Yatırım kararlarınızı kendi değerlendirmenizle ve gerektiğinde yetkili yatırım kuruluşlarından profesyonel destek alarak veriniz.";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(
    req.headers.get("Origin")
  );

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
        userError
      );

      return new Response(
        JSON.stringify({
          error: "Kullanıcı doğrulanamadı.",
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
        .select("plan, status, expires_at")
        .eq("user_id", userId)
        .maybeSingle();

    if (membershipError) {
      console.error(
        "Membership doğrulama hatası:",
        membershipError
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

    const membershipExpiry =
      membership?.expires_at
        ? new Date(
            membership.expires_at
          ).getTime()
        : null;

    const membershipNotExpired =
      !membershipExpiry ||
      (
        Number.isFinite(membershipExpiry) &&
        membershipExpiry > Date.now()
      );

    const hasActivePremium =
      membership?.plan === "premium" &&
      ["active", "trialing"].includes(
        membership.status
      ) &&
      membershipNotExpired;

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
      console.error(
        "Transactions sorgu hatası:",
        transactionsResult.error
      );
      throw new Error("Finans verileri yüklenemedi.");
    }

    if (goalsResult.error) {
      console.error(
        "Goals sorgu hatası:",
        goalsResult.error
      );
      throw new Error("Finans verileri yüklenemedi.");
    }

    if (subscriptionsResult.error) {
      console.error(
        "Subscriptions sorgu hatası:",
        subscriptionsResult.error
      );
      throw new Error("Finans verileri yüklenemedi.");
    }

    if (budgetResult.error) {
      console.error(
        "Budget sorgu hatası:",
        budgetResult.error
      );
      throw new Error("Finans verileri yüklenemedi.");
    }

    const transactions = transactionsResult.data || [];
    const goals = goalsResult.data || [];
    const subscriptions = subscriptionsResult.data || [];
    const budget = budgetResult.data || null;

    // Bu ay ve önceki ay işlemleri
    const istanbulYearMonth = () => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
      }).formatToParts(new Date());

      const year = parts.find(
        (part) => part.type === "year"
      )?.value;

      const month = parts.find(
        (part) => part.type === "month"
      )?.value;

      if (!year || !month) {
        throw new Error(
          "İstanbul tarih bilgisi oluşturulamadı"
        );
      }

      return `${year}-${month}`;
    };

    const currentMonth = istanbulYearMonth();

    const [year, monthNumber] =
      currentMonth.split("-").map(Number);

    const previousMonthYear =
      monthNumber === 1
        ? year - 1
        : year;

    const previousMonthNumber =
      monthNumber === 1
        ? 12
        : monthNumber - 1;

    const previousMonth =
      `${previousMonthYear}-${String(
        previousMonthNumber
      ).padStart(2, "0")}`;

    const currentMonthTransactions =
      transactions.filter(
        (transaction) =>
          String(transaction.date || "").slice(0, 7) ===
          currentMonth
      );

    const previousMonthTransactions =
      transactions.filter(
        (transaction) =>
          String(transaction.date || "").slice(0, 7) ===
          previousMonth
      );

    const calculateTransactionSummary = (
      items: typeof transactions
    ) => {
      const income = items
        .filter((t) => t.type === "income")
        .reduce(
          (sum, t) => sum + Number(t.amount || 0),
          0
        );

      const expense = items
        .filter((t) => t.type === "expense")
        .reduce(
          (sum, t) => sum + Number(t.amount || 0),
          0
        );

      const categoryTotals: Record<string, number> = {};

      for (const transaction of items) {
        if (transaction.type !== "expense") continue;

        const category =
          transaction.category || "Diğer";

        categoryTotals[category] =
          (categoryTotals[category] || 0) +
          Number(transaction.amount || 0);
      }

      return {
        income,
        expense,
        balance: income - expense,
        categoryTotals,
        transactionCount: items.length,
      };
    };

    const currentMonthSummary =
      calculateTransactionSummary(
        currentMonthTransactions
      );

    const previousMonthSummary =
      calculateTransactionSummary(
        previousMonthTransactions
      );

    const income =
      currentMonthSummary.income;

    const expense =
      currentMonthSummary.expense;

    const balance =
      currentMonthSummary.balance;

    const categoryTotals =
      currentMonthSummary.categoryTotals;
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

    const totalGoalRemaining = Math.max(
      totalGoalTarget - totalGoalSaved,
      0
    );

    const goalProgressPercent =
      totalGoalTarget > 0
        ? (totalGoalSaved / totalGoalTarget) * 100
        : 0;

    const monthlyNetCashFlow = income - expense;

    const budgetAmount = budget
      ? Number(budget.amount || 0)
      : null;

    const budgetUsagePercent =
      budgetAmount && budgetAmount > 0
        ? (expense / budgetAmount) * 100
        : null;

    const budgetRemainingCapacity =
      budgetAmount !== null
        ? Math.max(budgetAmount - expense, 0)
        : null;

    const goalMonthsAtCurrentNetFlow =
      totalGoalRemaining > 0 && monthlyNetCashFlow > 0
        ? Math.ceil(totalGoalRemaining / monthlyNetCashFlow)
        : null;

    const goalMonthsAt50PercentNetFlow =
      totalGoalRemaining > 0 && monthlyNetCashFlow > 0
        ? Math.ceil(totalGoalRemaining / (monthlyNetCashFlow * 0.5))
        : null;

    const goalMonthsAt70PercentNetFlow =
      totalGoalRemaining > 0 && monthlyNetCashFlow > 0
        ? Math.ceil(totalGoalRemaining / (monthlyNetCashFlow * 0.7))
        : null;

    // Abonelikler
    const monthlySubscriptionExpense =
      subscriptions.reduce(
        (sum, subscription) =>
          subscription.type === "income"
            ? sum
            : sum + Number(subscription.amount || 0),
        0
      );

    const monthlySubscriptionIncome =
      subscriptions.reduce(
        (sum, subscription) =>
          subscription.type === "income"
            ? sum + Number(subscription.amount || 0)
            : sum,
        0
      );

    const monthlySubscriptionNet =
      monthlySubscriptionIncome -
      monthlySubscriptionExpense;

    const financialSummary = {
      period: currentMonth,

      income,
      expense,
      balance,
      monthlyNetCashFlow,
      categoryTotals,

      previousMonth: {
        period: previousMonth,
        income: previousMonthSummary.income,
        expense: previousMonthSummary.expense,
        balance: previousMonthSummary.balance,
      },

      goals: {
        count: goals.length,
        target: totalGoalTarget,
        saved: totalGoalSaved,
        monthsAtCurrentNetFlow: goalMonthsAtCurrentNetFlow,
        monthsAt50PercentNetFlow: goalMonthsAt50PercentNetFlow,
        monthsAt70PercentNetFlow: goalMonthsAt70PercentNetFlow,
        remaining: totalGoalRemaining,
        progressPercent: goalProgressPercent,
      },

      subscriptions: {
        count: subscriptions.length,
        monthlyExpense: monthlySubscriptionExpense,
        monthlyIncome: monthlySubscriptionIncome,
        monthlyNet: monthlySubscriptionNet,
      },

      budget: budgetAmount,
      budgetUsagePercent,
      budgetRemainingCapacity,
      transactionCount:
        transactions.length,
    };

    console.log("Finansal özet hazır");

    // OpenAI API anahtarı
    const openaiKey =
      Deno.env.get("GROQ_API_KEY");

    if (!openaiKey) {
      console.error(
        "GROQ_API_KEY bulunamadı"
      );

      return new Response(
        JSON.stringify({
          error:
            "GROQ_API_KEY bulunamadı",
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
        "https://api.groq.com/openai/v1/responses",
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
            model: "openai/gpt-oss-20b",

            input: [
              {
                role: "system",

                content:
                  "Sen ParaAsistan uygulamasının kişisel finans koçusun. Kullanıcının sağlanan gerçek finansal verilerini analiz et ve sorusuna doğrudan cevap ver. Türkçe, net, sakin, anlaşılır ve uygulanabilir konuş. Verilerde bulunmayan bilgileri varsayma; belirsiz veya eksik veri varsa bunu açıkça belirt. Gelir, gider, bakiye ve abonelik gelir/giderlerini birbirine karıştırma. Bütçe, harcama kategorileri, hedefler ve önceki ay verileri mevcutsa bunları değerlendirmende kullan. Rakamları doğru kullan ve mümkün olduğunda hesaplamalarını verilen verilerle destekle. monthlyNetCashFlow yalnızca ilgili ayın gelir eksi gider değeridir ve mevcut birikim anlamına gelmez. goals.saved hedeflerde zaten birikmiş mevcut tutardır ve monthlyNetCashFlow ile toplanmamalıdır. goals.remaining hedef için kalan tutardır. Hedef süresi hesaplanırken kalan hedef tutarı üzerinden hesap yapılmalı ve aylık net akışın tamamının düzenli olarak hedefe ayrıldığı varsayımı açıkça belirtilmelidir. Mevcut ay tamamlanmamışsa kesin süre tahmini yapılmamalıdır. Kullanıcı açıkça yatırım konusu sormadıkça yatırım aracı, fon, hisse, kripto, mevduat veya portföy dağılımı önerme; al, sat, tut gibi işlem yönlendirmeleri yapma ve herhangi bir yüzdeyi yatırım amacıyla önerme. Kullanıcı yatırım konusu sorduğunda dahi kişiye özel yatırım tavsiyesi, ürün seçimi veya risk profiline göre portföy yönlendirmesi yapma; yalnızca genel eğitim amaçlı bilgi ver. Kullanıcının verilerinde bulunmayan harcama limiti, tasarruf oranı, bütçe sınırı veya hedef rakam uydurma. Yalnızca sağlanan finansal verilere dayalı bütçe yönetimi, tasarruf, harcama kontrolü, hedefler ve finansal planlama konusunda yardımcı ol. Hedef süresi için financialSummary.goals içindeki monthsAtCurrentNetFlow, monthsAt50PercentNetFlow ve monthsAt70PercentNetFlow alanlarını esas al; bu alanlar kod tarafından hesaplanır. Kendi alternatif aritmetik hesabınla bu değerleri değiştirme. Özellikle yüzde 50-70 katkı senaryolarında süreyi olduğundan kısa gösterme ve veri tarafından desteklenmeyen bir süre uydurma. Somut önerilerde yalnızca financialSummary içindeki mevcut rakamları ve kod tarafından hesaplanan alanları kullan. Kullanıcının verilerinde bulunmayan yeni TL tutarı, yüzde, oran, bütçe sınırı, tasarruf hedefi, ek gelir hedefi veya süre üretme. Bir öneri için sayısal değer vermek zorunlu değilse sayı kullanma. Sayısal bir senaryo ancak kullanıcı özellikle senaryo isterse oluşturulabilir; böyle durumda bunun örnek/varsayımsal olduğunu açıkça belirt ve gerçek kullanıcı verisi gibi sunma. Verilen bir değerden hesaplama yapıyorsan sonucu matematiksel olarak kontrol et. Kullanıcının mevcut bütçe limitini yeni bir yüzdeyle sınırlama veya verilmeyen bir tasarruf oranı belirleme. expense yalnızca transactions içindeki giderlerin toplamıdır ve subscription giderlerini expense değerine ekleme. Abonelik giderleri subscriptions alanında ayrı değerlendirilir. budgetRemainingCapacity yalnızca kullanılmayan bütçe harcama kapasitesidir; gelir, bakiye, tasarruf veya hedefe aktarılabilir nakit değildir. Kullanılmayan bütçeyi hedefe aktarılmış veya aktarılabilir para gibi gösterme. Bütçe kullanımında financialSummary.budgetUsagePercent değerini kullan.",
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

Bu verilere ve kullanıcının sorusuna göre kişiselleştirilmiş bir finansal değerlendirme yap.

Şu sırayı izle:

1. Mevcut durumu 2-4 cümleyle, yalnızca financialSummary içindeki gerçek değerleri kullanarak özetle. expense ile monthlySubscriptionExpense değerlerini toplama. Abonelikleri ayrı göster. budgetRemainingCapacity değerini nakit veya hedefe aktarılabilir para gibi sunma.
2. Kullanıcının sorusuna doğrudan cevap ver.
3. En önemli 3-5 öneriyi önem sırasına göre ver. Öneriler gerçek finansal verilere dayansın. Verilmeyen TL tutarı, yüzde, oran veya yeni limit uydurma; sayısal bir öneri için mevcut financialSummary değerlerini kullan.
4. Önceki ay verisi soruyla ilgiliyse değişimi belirt.
5. Bütçe verisi varsa financialSummary.budgetUsagePercent değerini kullan. budgetRemainingCapacity değerini yalnızca kullanılmayan harcama kapasitesi olarak açıkla; bunu gelir, bakiye, tasarruf veya hedefe aktarılabilir nakit olarak yorumlama.
                  6. Hedefler varsa toplam ilerlemeyi, mevcut birikimi (goals.saved), kalan tutarı (goals.remaining) ve ilerleme yüzdesini (goals.progressPercent) ayrı değerlendir. goals.saved değerini aylık gelir-gider farkıyla toplama.

                  7. Hedefe ulaşma süresi sorulursa financialSummary.goals içindeki hazır ay değerlerini kullan. Tamamı için monthsAtCurrentNetFlow, %50 katkı için monthsAt50PercentNetFlow, %70 katkı için monthsAt70PercentNetFlow alanlarını esas al. Yeni ve daha kısa bir süre hesaplama. Mevcut ay tamamlanmamışsa bu değerleri tahmini planlama olarak sun.

                  8. Aboneliklerde aylık gider, aylık gelir ve net etki değerlerini ayrı değerlendir.
9. Veriler yeterli değilse tahmin yapmak yerine hangi bilginin eksik olduğunu belirt.

Gereksiz uzunlukta yazma. Kullanıcıya anlaşılır, pratik ve gerçek verilerine dayalı bir cevap ver.

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

    // AI servisi hata verdi
    if (!openaiResponse.ok) {
      console.error(
        "AI servisi HTTP hatası:",
        openaiResponse.status
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
        "AI servis cevabı JSON olarak okunamadı:",
        openaiResponse.status
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
        "AI servis cevabında metin bulunamadı:",
        openaiResponse.status
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
        legalNotice: LEGAL_NOTICE,
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
    console.error(
      "FINANCE COACH GENEL HATA:",
      error
    );

    return new Response(
      JSON.stringify({
        error: "Finans koçu şu anda kullanılamıyor",
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
