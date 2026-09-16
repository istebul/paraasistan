import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const daysInMonth = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Yalnızca POST desteklenir" }, 405);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  if (!serviceRoleKey || !supabaseUrl) {
    return jsonResponse({ error: "Supabase servis ayarları eksik" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (authorization !== `Bearer ${serviceRoleKey}`) {
    return jsonResponse({ error: "Yetkisiz otomasyon çağrısı" }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const recurringMonth = `${year}-${String(month).padStart(2, "0")}`;
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("subscriptions")
      .select("id, user_id, title, amount, day, type")
      .gte("day", 1)
      .lte("day", 31);

    if (subscriptionsError) throw subscriptionsError;

    const records = (subscriptions || []).map((subscription) => ({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      recurring_month: recurringMonth,
      title: subscription.title,
      type: subscription.type || "expense",
      category: "Abonelik",
      amount: Number(subscription.amount || 0),
      date: `${recurringMonth}-${String(
        Math.min(Number(subscription.day), daysInMonth(year, month))
      ).padStart(2, "0")}`,
    }));

    if (records.length === 0) {
      return jsonResponse({ created: 0, month: recurringMonth });
    }

    const { data, error } = await supabase
      .from("transactions")
      .upsert(records, {
        onConflict: "subscription_id,recurring_month",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) throw error;

    return jsonResponse({
      created: data?.length || 0,
      month: recurringMonth,
    });
  } catch (error) {
    console.error("Recurring transaction generation failed:", error);
    return jsonResponse({ error: "Tekrarlayan kayıtlar oluşturulamadı" }, 500);
  }
});
