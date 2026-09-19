import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "./lib/supabase";
import { calculateTotals } from "./lib/finance";
import {
  validateGoal,
  validateSubscription,
  validateTransaction,
} from "./lib/validation";
import Toast from "./components/Toast";
import AppNavigation from "./components/AppNavigation";
import AppHeader from "./components/AppHeader";
import TransactionForm from "./components/TransactionForm";
import TransactionHistory from "./components/TransactionHistory";
import GoalForm from "./components/GoalForm";
import GoalList from "./components/GoalList";
import GoalContributionModal from "./components/GoalContributionModal";
import SubscriptionForm from "./components/SubscriptionForm";
import SubscriptionList from "./components/SubscriptionList";
import EditTransactionModal from "./components/EditTransactionModal";
import ConfirmDialog from "./components/ConfirmDialog";
import DashboardStats from "./components/DashboardStats";
import {
  DashboardBudgetCard,
  DashboardHealthCard,
} from "./components/DashboardHealthCard";
import DashboardSpendingCard from "./components/DashboardSpendingCard";
import DashboardGoalsCard from "./components/DashboardGoalsCard";
import DashboardSubscriptionsCard from "./components/DashboardSubscriptionsCard";
import RecentTransactionsCard from "./components/RecentTransactionsCard";
import heroImage from "./assets/hero.png";
import "./index.css";

const CATEGORY_OPTIONS = [
  "Genel",
  "Market",
  "Ulaşım",
  "Fatura",
  "Kira",
  "Yemek",
  "Sağlık",
  "Eğlence",
  "Alışveriş",
  "Eğitim",
  "Diğer",
];

const money = (value, currency = "TRY") =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency || "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const dateText = (value) => {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "tr-TR"
  );
};

const today = () => {
  const date = new Date();
  const localTime = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60 * 1000
  );

  return localTime.toISOString().slice(0, 10);
};

const monthKey = (date) => {
  if (!date) return "";
  return String(date).slice(0, 7);
};

const currentMonth = () => today().slice(0, 7);

const previousMonth = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const monthLabel = (month) => {
  if (!month) return "";

  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(
    year,
    monthNumber - 1,
    1
  ).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
};

const daysUntil = (date) => {
  if (!date) return null;

  const target = new Date(`${date}T00:00:00`);
  const now = new Date();

  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return Math.ceil(
    (target.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24)
  );
};

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        const { data, error } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

        if (error) throw error;

        if (!data.session) {
          setMessage(
            "Kayıt başarılı. E-posta doğrulaması açıksa gelen kutunu kontrol et."
          );
        } else {
          setMessage("Hesabın oluşturuldu.");
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(
        error.message || "Bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-visual">
          <img
            src={heroImage}
            alt="ParaAsistan finans yönetimi görseli"
          />
          <span className="eyebrow">PARAASISTAN</span>
          <h2>Paranı izle. Geleceğini planla.</h2>
          <p>
            Gelirlerini, hedeflerini ve günlük kararlarını tek bir sakin ekranda yönet.
          </p>
        </section>

        <div className="auth-card">
          <div className="brand-large">
            <div className="brand-icon">₺</div>

            <div>
              <h1>ParaAsistan</h1>
              <p>
                Finansal hayatının akıllı yardımcısı
              </p>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              className={
                mode === "login" ? "active" : ""
              }
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Giriş Yap
            </button>

            <button
              className={
                mode === "register" ? "active" : ""
              }
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={submit}>
            {mode === "register" && (
              <label>
                Ad Soyad

                <input
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Adınız Soyadınız"
                  required
                />
              </label>
            )}

            <label>
              E-posta

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="ornek@mail.com"
                required
              />
            </label>

            <label>
              �?ifre

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="En az 6 karakter"
                minLength={6}
                required
              />
            </label>

            {message && (
              <div className="notice">{message}</div>
            )}

            <button
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "İşleniyor..."
                : mode === "login"
                ? "Giriş Yap"
                : "Hesap Oluştur"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] =
    useState(true);

  const [page, setPage] = useState("dashboard");

  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalContributions, setGoalContributions] = useState([]);
  const [subscriptions, setSubscriptions] =
    useState([]);
  const [budget, setBudget] = useState(15000);
  const [categoryLimits, setCategoryLimits] = useState({});
  const [categoryLimitInputs, setCategoryLimitInputs] = useState({});

  const [profile, setProfile] = useState(null);
  const [membership, setMembership] =
    useState(null);

  const [loadingData, setLoadingData] =
    useState(false);
  const [profileSaving, setProfileSaving] =
    useState(false);

  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth());

  const [transactionSearch, setTransactionSearch] =
    useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] =
    useState("all");
  const [transactionCategoryFilter, setTransactionCategoryFilter] =
    useState("all");

  const [editingTransaction, setEditingTransaction] =
    useState(null);

  const [profileForm, setProfileForm] =
    useState({
      full_name: "",
      phone: "",
      currency: "TRY",
      monthly_income_target: "",
    });

  const [transactionForm, setTransactionForm] =
    useState({
      title: "",
      type: "expense",
      category: "Genel",
      amount: "",
      date: today(),
    });

  const [goalForm, setGoalForm] = useState({
    title: "",
    target: "",
    saved: "",
    deadline: "",
  });

  const [contributionGoal, setContributionGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");

  const [subscriptionForm, setSubscriptionForm] =
    useState({
      title: "",
      amount: "",
      day: "1",
      type: "expense",
    });


  const [coachQuestion, setCoachQuestion] =
    useState("");
  const [coachAnswer, setCoachAnswer] =
    useState("");
  const [coachHistory, setCoachHistory] =
    useState([]);
  const [coachLoading, setCoachLoading] =
    useState(false);
  const [coachError, setCoachError] =
    useState("");
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const requestConfirmation = (message) =>
    new Promise((resolve) => {
      setConfirmDialog({ message, resolve });
    });

  const closeConfirmation = (confirmed) => {
    confirmDialog?.resolve(confirmed);
    setConfirmDialog(null);
  };

  const userId = session?.user?.id;

  const profileFallbackName =
    session?.user?.user_metadata?.full_name ||
    "";

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      setSession(data.session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setCheckingSession(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!userId) return;

    setLoadingData(true);

    try {
      const [
        transactionsResult,
        goalsResult,
        contributionsResult,
        subscriptionsResult,
        budgetResult,
        profileResult,
        membershipResult,
        categoryLimitsResult,
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .order("date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("goals")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("goal_contributions")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("subscriptions")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("budgets")
          .select("*")
          .maybeSingle(),

        supabase
          .from("profiles")
          .select("*")
          .maybeSingle(),

        supabase
          .from("budget_category_limits")
          .select("*")
          .order("category", {
            ascending: true,
          }),

        supabase
          .from("memberships")
          .select("*")
          .maybeSingle(),
      ]);

      if (transactionsResult.error)
        throw transactionsResult.error;

      if (goalsResult.error)
        throw goalsResult.error;

      if (contributionsResult.error)
        throw contributionsResult.error;

      if (subscriptionsResult.error)
        throw subscriptionsResult.error;

      if (budgetResult.error)
        throw budgetResult.error;

      if (profileResult.error)
        throw profileResult.error;

      if (membershipResult.error)
        throw membershipResult.error;

      if (categoryLimitsResult.error)
        throw categoryLimitsResult.error;

      setCategoryLimits(
        Object.fromEntries(
          (Array.isArray(categoryLimitsResult.data) ? categoryLimitsResult.data : []).map((item) => [
            item.category,
            Number(item.amount || 0),
          ])
        )
      );

      setCategoryLimitInputs(
        Object.fromEntries(
          (Array.isArray(categoryLimitsResult.data) ? categoryLimitsResult.data : []).map((item) => [
            item.category,
            String(item.amount || ""),
          ])
        )
      );

      setTransactions(
        transactionsResult.data || []
      );

      setGoals(goalsResult.data || []);

      setGoalContributions(
        contributionsResult.data || []
      );

      setSubscriptions(
        subscriptionsResult.data || []
      );

      const savedBudget =
        budgetResult.data?.amount;

      if (
        savedBudget !== undefined &&
        savedBudget !== null
      ) {
        setBudget(Number(savedBudget));
      }

      const profileData =
        profileResult.data || null;

      setProfile(profileData);

      setProfileForm({
        full_name:
          profileData?.full_name ||
          profileFallbackName ||
          "",
        phone: profileData?.phone || "",
        currency:
          profileData?.currency || "TRY",
        monthly_income_target:
          profileData?.monthly_income_target ||
          "",
      });

      setMembership(
        membershipResult.data || null
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Veriler yüklenemedi.",
        "error"
      );
    } finally {
      setLoadingData(false);
    }
  }, [profileFallbackName, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currency =
    profile?.currency ||
    profileForm.currency ||
    "TRY";

  const userName =
    profile?.full_name ||
    session?.user?.user_metadata
      ?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Kullanıcı";

  const isPremium =
    membership?.plan === "premium" &&
    ["active", "trialing"].includes(
      membership?.status
    );

  const selectedMonthTransactions =
    useMemo(() => {
      return transactions.filter(
        (item) =>
          monthKey(item.date) ===
          selectedMonth
      );
    }, [transactions, selectedMonth]);

  const previousMonthTransactions =
    useMemo(() => {
      const prev = previousMonth(
        selectedMonth
      );

      return transactions.filter(
        (item) =>
          monthKey(item.date) === prev
      );
    }, [transactions, selectedMonth]);

  const totals = useMemo(
    () =>
      calculateTotals(
        selectedMonthTransactions
      ),
    [selectedMonthTransactions]
  );

  const previousTotals = useMemo(
    () =>
      calculateTotals(
        previousMonthTransactions
      ),
    [previousMonthTransactions]
  );

  const allTotals = useMemo(
    () => calculateTotals(transactions),
    [transactions]
  );

  const savingsRate =
    totals.income > 0
      ? (totals.balance /
          totals.income) *
        100
      : 0;

  const expenseChange =
    previousTotals.expense > 0
      ? ((totals.expense -
          previousTotals.expense) /
          previousTotals.expense) *
        100
      : null;

  const incomeChange =
    previousTotals.income > 0
      ? ((totals.income -
          previousTotals.income) /
          previousTotals.income) *
        100
      : null;

  const savingsChange =
    previousTotals.balance !== 0
      ? ((totals.balance -
          previousTotals.balance) /
          Math.abs(previousTotals.balance)) *
        100
      : null;

  const budgetUsage =
    budget > 0
      ? (totals.expense / budget) * 100
      : 0;

  const budgetRemaining =
    budget - totals.expense;

  const subscriptionTotal =
    subscriptions.reduce(
      (sum, item) =>
        item.type === "income"
          ? sum
          : sum + Number(item.amount || 0),
      0
    );

  const categoryTotals = useMemo(() => {
    const result = {};

    selectedMonthTransactions
      .filter(
        (item) => item.type === "expense"
      )
      .forEach((item) => {
        result[item.category] =
          (result[item.category] || 0) +
          Number(item.amount || 0);
      });

    return Object.entries(result).sort(
      (a, b) => b[1] - a[1]
    );
  }, [selectedMonthTransactions]);

  const monthlyTrend = useMemo(() => {
    const months = [];
    let month = selectedMonth;

    for (let index = 0; index < 6; index += 1) {
      months.unshift(month);
      month = previousMonth(month);
    }

    return months.map((monthKeyValue) => {
      const monthTotals = calculateTotals(
        transactions.filter(
          (item) =>
            monthKey(item.date) ===
            monthKeyValue
        )
      );

      return {
        month: monthKeyValue,
        label: monthLabel(monthKeyValue),
        ...monthTotals,
      };
    });
  }, [selectedMonth, transactions]);

  const transactionResults = useMemo(() => {
    const search =
      transactionSearch.trim().toLowerCase();

    return transactions
      .filter((item) => {
        const matchesSearch =
          !search ||
          item.title
            ?.toLowerCase()
            .includes(search) ||
          item.category
            ?.toLowerCase()
            .includes(search);

        const matchesType =
          transactionTypeFilter === "all" ||
          item.type === transactionTypeFilter;

        const matchesCategory =
          transactionCategoryFilter ===
            "all" ||
          item.category ===
            transactionCategoryFilter;

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory
        );
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
  }, [
    transactions,
    transactionSearch,
    transactionTypeFilter,
    transactionCategoryFilter,
  ]);

  const exportTransactions = () => {
    if (transactionResults.length === 0) {
      showToast(
        "Dışa aktarılacak işlem bulunamadı.",
        "error"
      );
      return;
    }

    const escapeCsv = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = [
      [
        "Açıklama",
        "Tür",
        "Kategori",
        "Tutar",
        "Tarih",
      ],
      ...transactionResults.map((transaction) => [
        transaction.title,
        transaction.type === "income"
          ? "Gelir"
          : "Gider",
        transaction.category,
        transaction.amount,
        transaction.date,
      ]),
    ];

    const csv = `\uFEFF${rows
      .map((row) =>
        row.map(escapeCsv).join(";")
      )
      .join("\r\n")}`;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `paraasistan-islemler-${selectedMonth}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    showToast(
      "İşlemler CSV olarak indirildi."
    );
  };

  const financialHealth = useMemo(() => {
    if (
      totals.income === 0 &&
      totals.expense === 0
    ) {
      return 0;
    }

    let score = 50;

    if (totals.income > 0) {
      if (savingsRate >= 30) score += 25;
      else if (savingsRate >= 20)
        score += 20;
      else if (savingsRate >= 10)
        score += 10;
      else if (savingsRate < 0)
        score -= 25;
    }

    if (budget > 0) {
      if (budgetUsage <= 70) score += 15;
      else if (budgetUsage <= 90)
        score += 8;
      else if (budgetUsage > 100)
        score -= 20;
    }

    if (goals.length > 0) {
      const avgGoal =
        goals.reduce((sum, goal) => {
          const target =
            Number(goal.target) || 0;

          const saved =
            Number(goal.saved) || 0;

          return (
            sum +
            (target > 0
              ? Math.min(
                  saved / target,
                  1
                )
              : 0)
          );
        }, 0) / goals.length;

      score += Math.round(avgGoal * 10);
    }

    return Math.max(
      0,
      Math.min(100, Math.round(score))
    );
  }, [
    totals,
    savingsRate,
    budget,
    budgetUsage,
    goals,
  ]);

  const healthLabel =
    financialHealth >= 80
      ? "Çok iyi"
      : financialHealth >= 65
      ? "İyi"
      : financialHealth >= 50
      ? "Orta"
      : "Dikkat";

  const healthMessage =
    financialHealth === 0
      ? "Skorunu oluşturmak için bu aya ait gelir veya gider eklemelisin."
      : financialHealth >= 80
      ? "Finansal durumun oldukça sağlıklı görünüyor."
      : financialHealth >= 65
      ? "Genel durumun iyi. Birkaç küçük iyileştirme ile daha güçlü hale gelebilir."
      : financialHealth >= 50
      ? "Finansal durumunu biraz daha yakından takip etmen faydalı olabilir."
      : "Bu ay giderlerini ve bütçeni özellikle dikkatli takip etmelisin.";

  const dashboardSummary = useMemo(() => {
    if (
      totals.income === 0 &&
      totals.expense === 0
    ) {
      return "Bu ay henüz yeterli finansal veri bulunmuyor.";
    }

    if (totals.balance < 0) {
      return `Bu ay ${money(
        Math.abs(totals.balance),
        currency
      )} açık durumdasın. Giderlerini yakından takip etmen faydalı olabilir.`;
    }

    if (budget > 0 && budgetUsage >= 90) {
      return `Bu ay bütçenin %${Math.round(
        budgetUsage
      )}'ini kullandın. Ayın kalanında harcamalarını kontrollü tutman önemli.`;
    }

    if (savingsRate >= 20) {
      return `Bu ay gelirinin yaklaşık %${Math.round(
        savingsRate
      )}'ini koruyabiliyorsun. Tasarruf tarafında güçlü bir tablo oluşuyor.`;
    }

    return `Bu ay ${money(
      totals.balance,
      currency
    )} net bakiyen var. Harcama ve bütçe dengesini takip etmeye devam edebilirsin.`;
  }, [
    totals,
    currency,
    budget,
    budgetUsage,
    savingsRate,
  ]);

  const financialInsights = useMemo(() => {
    const insights = [];

    if (
      totals.income === 0 &&
      totals.expense === 0
    ) {
      insights.push({
        title: "Veri bekleniyor",
        text: "Bu ay henüz gelir veya gider kaydı bulunmuyor.",
        type: "info",
      });
    }

    if (totals.income === 0) {
      insights.push({
        title: "Gelir kaydı eksik",
        text: "Bu ay gelir kaydı bulunmuyor. Gelirlerini ekleyerek finansal analizini güçlendirebilirsin.",
        type: "warning",
      });
    }

    if (totals.balance < 0) {
      insights.push({
        title: "Negatif aylık bakiye",
        text: `Bu ay giderlerin gelirlerinden ${money(
          Math.abs(totals.balance),
          currency
        )} daha yüksek.`,
        type: "danger",
      });
    } else if (
      totals.income > 0 &&
      totals.expense > 0
    ) {
      insights.push({
        title: "Gelir-gider dengesi",
        text: `Bu ay ${money(
          totals.balance,
          currency
        )} net bakiyen var. Gelirlerinin yaklaşık %${Math.round(
          Math.max(savingsRate, 0)
        )}'ini koruyabiliyorsun.`,
        type:
          savingsRate >= 20
            ? "success"
            : "info",
      });
    }

    if (
      previousTotals.expense > 0 &&
      expenseChange !== null &&
      expenseChange !== 0
    ) {
      const increased = expenseChange > 0;

      insights.push({
        title: increased
          ? "Giderlerin arttı"
          : "Giderlerin azaldı",
        text: `Bu ay giderlerin geçen aya göre yaklaşık %${Math.round(
          Math.abs(expenseChange)
        )} ${
          increased
            ? "daha yüksek"
            : "daha düşük"
        }.`,
        type: increased
          ? "warning"
          : "success",
      });
    }

    if (budget > 0) {
      if (budgetUsage > 100) {
        insights.push({
          title: "Bütçe aşıldı",
          text: `Aylık bütçenin %${Math.round(
            budgetUsage
          )}'ini kullandın ve ${money(
            Math.abs(budgetRemaining),
            currency
          )} tutarında aşım oluştu.`,
          type: "danger",
        });
      } else if (budgetUsage >= 80) {
        insights.push({
          title: "Bütçeye dikkat",
          text: `Bütçenin %${Math.round(
            budgetUsage
          )}'i kullanıldı. Kalan bütçen ${money(
            Math.max(budgetRemaining, 0),
            currency
          )}.`,
          type: "warning",
        });
      } else {
        insights.push({
          title: "Bütçende alan var",
          text: `Bu ay bütçende ${money(
            Math.max(budgetRemaining, 0),
            currency
          )} kullanılabilir alan kaldı.`,
          type: "success",
        });
      }
    }

    if (
      savingsRate >= 20 &&
      totals.income > 0
    ) {
      insights.push({
        title: "Güçlü tasarruf",
        text: `Gelirinin yaklaşık %${Math.round(
          savingsRate
        )}'ini koruyabiliyorsun.`,
        type: "success",
      });
    }

    if (
      categoryTotals.length > 0
    ) {
      const [
        topCategory,
        topAmount,
      ] = categoryTotals[0];

      const percentage =
        totals.expense > 0
          ? (topAmount /
              totals.expense) *
            100
          : 0;

      insights.push({
        title: `${topCategory} en büyük gider`,
        text: `${money(
          topAmount,
          currency
        )} ile toplam giderinin yaklaşık %${Math.round(
          percentage
        )}'ini oluşturuyor.`,
        type: "info",
      });
    }

    if (insights.length === 0) {
      insights.push({
        title: "Verilerin hazır",
        text: "Daha fazla işlem ekledikçe ParaAsistan daha anlamlı finansal öneriler oluşturabilir.",
        type: "info",
      });
    }

    return insights.slice(0, 4);
  }, [
    totals,
    previousTotals,
    expenseChange,
    budget,
    budgetRemaining,
    budgetUsage,
    savingsRate,
    categoryTotals,
    currency,
  ]);

  const addTransaction = async (e) => {
    e.preventDefault();

    const validationError = validateTransaction(
      transactionForm
    );

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    const amount = Number(
      transactionForm.amount
    );

    const { data, error } =
      await supabase
        .from("transactions")
        .insert({
          user_id: session.user.id,
          title:
            transactionForm.title.trim(),
          type: transactionForm.type,
          category:
            transactionForm.category,
          amount,
          date: transactionForm.date,
        })
        .select()
        .single();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setTransactions((prev) => [
      data,
      ...prev,
    ]);

    setSelectedMonth(
      monthKey(transactionForm.date)
    );

    setTransactionForm({
      title: "",
      type: "expense",
      category: "Genel",
      amount: "",
      date: today(),
    });
  };

  const startEditTransaction = (
    transaction
  ) => {
    setEditingTransaction({
      ...transaction,
      amount: String(
        transaction.amount || ""
      ),
    });
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null);
  };

  const updateTransaction = async (e) => {
    e.preventDefault();

    if (!editingTransaction) return;

    const validationError = validateTransaction(
      editingTransaction
    );

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    const amount = Number(
      editingTransaction.amount
    );

    const { data, error } =
      await supabase
        .from("transactions")
        .update({
          title:
            editingTransaction.title.trim(),
          type: editingTransaction.type,
          category:
            editingTransaction.category,
          amount,
          date: editingTransaction.date,
        })
        .eq("id", editingTransaction.id)
        .select()
        .single();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setTransactions((prev) =>
      prev.map((item) =>
        item.id === data.id
          ? data
          : item
      )
    );

    setEditingTransaction(null);

    setSelectedMonth(
      monthKey(data.date)
    );
  };

  const deleteTransaction = async (id) => {
    if (
      !(await requestConfirmation(
        "Bu işlemi silmek istiyor musun?"
      ))
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setTransactions((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  const addGoal = async (e) => {
    e.preventDefault();

    const validationError = validateGoal(
      goalForm
    );

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    const target = Number(
      goalForm.target
    );

    const saved = Number(
      goalForm.saved || 0
    );

    const { data, error } =
      await supabase
        .from("goals")
        .insert({
          user_id: session.user.id,
          title: goalForm.title.trim(),
          target,
          saved,
          deadline:
            goalForm.deadline || null,
        })
        .select()
        .single();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setGoals((prev) => [
      data,
      ...prev,
    ]);

    setGoalForm({
      title: "",
      target: "",
      saved: "",
      deadline: "",
    });
  };

  const deleteGoal = async (id) => {
    if (
      !(await requestConfirmation(
        "Bu hedefi silmek istiyor musun?"
      ))
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("goals")
        .delete()
        .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setGoals((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  const addGoalContribution = async (
    event
  ) => {
    event.preventDefault();

    if (!contributionGoal) return;

    const amount = Number(
      contributionAmount
    );

    const remaining = Math.max(
      Number(
        contributionGoal.target || 0
      ) -
        Number(
          contributionGoal.saved || 0
        ),
      0
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > remaining
    ) {
      showToast(
        remaining > 0
          ? `Tutar ${money(
              remaining,
              currency
            )} değerini aşamaz.`
          : "Bu hedef tamamlanmış.",
        "error"
      );
      return;
    }

    const {
      data: contribution,
      error: contributionError,
    } = await supabase
      .from("goal_contributions")
      .insert({
        goal_id: contributionGoal.id,
        user_id: session.user.id,
        amount,
        note:
          contributionNote.trim() ||
          null,
      })
      .select()
      .single();

    if (contributionError) {
      showToast(
        contributionError.message,
        "error"
      );
      return;
    }

    setGoalContributions((items) => [
      contribution,
      ...items,
    ]);

    const nextSaved =
      Number(
        contributionGoal.saved || 0
      ) + amount;

    const { data, error } =
      await supabase
        .from("goals")
        .update({
          saved: nextSaved,
        })
        .eq(
          "id",
          contributionGoal.id
        )
        .select()
        .single();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setGoals((items) =>
      items.map((item) =>
        item.id === data.id
          ? data
          : item
      )
    );

    setContributionGoal(null);
    setContributionAmount("");
    setContributionNote("");

    showToast(
      "Hedef birikimin güncellendi."
    );
  };

  const addSubscription = async (
    e
  ) => {
    e.preventDefault();

    const validationError =
      validateSubscription(
        subscriptionForm
      );

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    const amount = Number(
      subscriptionForm.amount
    );

    const day = Number(
      subscriptionForm.day
    );

    const { data, error } =
      await supabase
        .from("subscriptions")
        .insert({
          user_id: session.user.id,
          title:
            subscriptionForm.title.trim(),
          amount,
          day,
          type: subscriptionForm.type,
        })
        .select()
        .single();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setSubscriptions((prev) => [
      data,
      ...prev,
    ]);

    setSubscriptionForm({
      title: "",
      amount: "",
      day: "1",
      type: "expense",
    });
  };

  const deleteSubscription = async (
    id
  ) => {
    if (
      !(await requestConfirmation(
        "Bu aboneliği silmek istiyor musun?"
      ))
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("subscriptions")
        .delete()
        .eq("id", id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setSubscriptions((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  const saveCategoryLimit = async (category) => {
    const rawValue =
      categoryLimitInputs[category] ?? "";

    const value =
      rawValue === ""
        ? 0
        : Number(rawValue);

    if (!Number.isFinite(value) || value < 0) {
      showToast(
        "Geçerli bir kategori bütçesi gir.",
        "error"
      );
      return;
    }

    const { data, error } =
      await supabase
        .from("budget_category_limits")
        .upsert(
          {
            user_id: session.user.id,
            category,
            amount: value,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,category",
          }
        )
        .select()
        .single();

    if (error) {
      showToast(error.message, "error");
      return;
    }

    setCategoryLimits((prev) => ({
      ...prev,
      [category]: Number(data.amount || 0),
    }));

    setCategoryLimitInputs((prev) => ({
      ...prev,
      [category]: String(data.amount || ""),
    }));

    showToast(
      `${category} bütçesi güncellendi.`,
      "success"
    );
  };
  const saveProfile = async (e) => {
    e.preventDefault();

    if (!session?.user?.id) return;

    setProfileSaving(true);

    try {
      const profileData = {
        id: session.user.id,
        full_name:
          profileForm.full_name.trim(),
        phone:
          profileForm.phone.trim(),
        currency:
          profileForm.currency,
        monthly_income_target:
          Number(
            profileForm
              .monthly_income_target ||
              0
          ),
        updated_at:
          new Date().toISOString(),
      };

      const { data, error } =
        await supabase
          .from("profiles")
          .upsert(profileData)
          .select()
          .single();

      if (error) throw error;

      setProfile(data);

      await supabase.auth.updateUser({
        data: {
          full_name:
            profileForm.full_name.trim(),
        },
      });

      showToast(
        "Profil bilgilerin kaydedildi."
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Profil bilgileri kaydedilemedi.",
        "error"
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const askCoach = async (
    customQuestion = ""
  ) => {
    setCoachLoading(true);
    setCoachError("");

    const question =
      customQuestion.trim() ||
      coachQuestion.trim() ||
      "Finansal durumumu analiz et ve bana en önemli 3 öneriyi ver.";

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "finance-coach",
          {
            body: {
              question,
            },
          }
        );

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const answer =
        data?.answer ||
        "AI cevap üretemedi.";

      setCoachAnswer(answer);

      setCoachHistory((history) => [
        {
          id: `${Date.now()}-${history.length}`,
          question,
          answer,
        },
        ...history,
      ].slice(0, 5));
    } catch (error) {
      console.error(error);

      setCoachError(
        error.message ||
          "AI Finans Koçu ile bağlantı kurulamadı."
      );
    } finally {
      setCoachLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const navigate = (nextPage) => {
    setPage(nextPage);
  };

  if (checkingSession) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>
          ParaAsistan hazırlanıyor...
        </p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      <ConfirmDialog
        dialog={confirmDialog}
        onClose={closeConfirmation}
      />

      <AppNavigation
        page={page}
        isPremium={isPremium}
        userName={userName}
        email={session.user.email}
        onNavigate={navigate}
        onLogout={logout}
      />

      <main className="main-content">
        <AppHeader
          page={page}
          userName={userName}
          selectedMonth={selectedMonth}
          loadingData={loadingData}
          onMonthChange={setSelectedMonth}
        />

        {/* DASHBOARD */}

        {page === "dashboard" && (
          <>
            <section
              style={{
                marginBottom: "18px",
                padding: "14px 18px",
                borderRadius: "14px",
                background:
                  "rgba(99,102,241,.08)",
                border:
                  "1px solid rgba(99,102,241,.14)",
              }}
            >
              <strong>
                {monthLabel(selectedMonth)}
              </strong>

              <span
                style={{
                  marginLeft: "8px",
                  opacity: 0.7,
                }}
              >
                finansal özeti
              </span>

              <p
                style={{
                  margin: "8px 0 0",
                  opacity: 0.78,
                  lineHeight: 1.5,
                }}
              >
                {dashboardSummary}
              </p>
            </section>

            <DashboardStats
              totals={totals}
              currency={currency}
              incomeChange={incomeChange}
              expenseChange={expenseChange}
              savingsChange={savingsChange}
              savingsRate={savingsRate}
              money={money}
            />

            <section
              className="dashboard-grid"
              style={{
                marginBottom: "18px",
              }}
            >
              <DashboardHealthCard
                score={financialHealth}
                label={healthLabel}
                message={healthMessage}
              />

              <DashboardBudgetCard
                month={monthLabel(
                  selectedMonth
                )}
                usage={budgetUsage}
                remaining={budgetRemaining}
                currency={currency}
                money={money}
              />
            </section>

            <section
              className="dashboard-grid"
              style={{
                marginBottom: "18px",
              }}
            >
              <DashboardSpendingCard
                month={monthLabel(
                  selectedMonth
                )}
                categoryTotals={
                  categoryTotals
                }
                expenseTotal={
                  totals.expense
                }
                currency={currency}
                money={money}
                onExport={
                  exportTransactions
                }
              />

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      Akıllı İçgörüler
                    </h2>

                    <p>
                      ParaAsistan'ın
                      otomatik analizi
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    marginTop: "10px",
                  }}
                >
                  {financialInsights.map(
                    (item, index) => (
                      <div
                        key={index}
                        className={`insight-item insight-${item.type}`}
                        style={{
                          padding: "12px",
                          borderRadius:
                            "12px",
                          background:
                            item.type === "success"
                              ? "rgba(94,224,154,.14)"
                              : item.type === "warning"
                                ? "rgba(244,190,84,.14)"
                                : item.type === "danger"
                                  ? "rgba(239,105,105,.14)"
                                  : "rgba(121,181,255,.14)",
                          borderLeft:
                            item.type === "success"
                              ? "3px solid rgba(94,224,154,.9)"
                              : item.type === "warning"
                                ? "3px solid rgba(244,190,84,.9)"
                                : item.type === "danger"
                                  ? "3px solid rgba(239,105,105,.9)"
                                  : "3px solid rgba(121,181,255,.9)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 8px",
                              borderRadius: "999px",
                              fontSize: "10px",
                              fontWeight: 750,
                              letterSpacing: "0.02em",
                              background:
                                item.type === "success"
                                  ? "rgba(94,224,154,.24)"
                                  : item.type === "warning"
                                    ? "rgba(244,190,84,.24)"
                                    : item.type === "danger"
                                      ? "rgba(239,105,105,.24)"
                                      : "rgba(121,181,255,.24)",
                              border:
                                item.type === "success"
                                  ? "1px solid rgba(94,224,154,.42)"
                                  : item.type === "warning"
                                    ? "1px solid rgba(244,190,84,.42)"
                                    : item.type === "danger"
                                      ? "1px solid rgba(239,105,105,.42)"
                                      : "1px solid rgba(121,181,255,.42)",
                              color:
                                item.type === "success"
                                  ? "rgb(94,224,154)"
                                  : item.type === "warning"
                                    ? "rgb(244,190,84)"
                                    : item.type === "danger"
                                      ? "rgb(239,105,105)"
                                      : "rgb(121,181,255)",
                            }}
                          >
                            {item.type === "success"
                              ? "Olumlu"
                              : item.type === "warning"
                                ? "Dikkat"
                                : item.type === "danger"
                                  ? "Kritik"
                                  : "Bilgi"}
                          </span>
                          <strong
                            style={{
                              color:
                                item.type === "success"
                                  ? "rgb(94,224,154)"
                                  : item.type === "warning"
                                    ? "rgb(244,190,84)"
                                    : item.type === "danger"
                                      ? "rgb(239,105,105)"
                                      : "rgb(121,181,255)",
                            }}
                          >
                            {item.title}
                          </strong>
                        </div>

                        <p
                          style={{
                            margin:
                              "5px 0 0",
                            opacity: 0.75,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.text}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            <section
              className="dashboard-grid"
              style={{
                marginBottom: "18px",
              }}
            >
              <DashboardGoalsCard
                goals={goals}
                currency={currency}
                money={money}
                onOpenGoals={() =>
                  navigate("goals")
                }
              />

              <DashboardSubscriptionsCard
                items={subscriptions}
                total={subscriptionTotal}
                currency={currency}
                money={money}
                onOpenSubscriptions={() =>
                  navigate(
                    "subscriptions"
                  )
                }
              />
            </section>

            <RecentTransactionsCard
              transactions={
                selectedMonthTransactions
              }
              currency={currency}
              money={money}
              dateText={dateText}
              onOpenTransactions={() =>
                navigate("transactions")
              }
            />
          </>
        )}

        {/* TRANSACTIONS */}

        {page === "transactions" && (
          <>
            <TransactionForm
              form={transactionForm}
              categories={CATEGORY_OPTIONS}
              onChange={setTransactionForm}
              onSubmit={addTransaction}
            />

            <TransactionHistory
              results={transactionResults}
              total={transactions.length}
              categories={CATEGORY_OPTIONS}
              search={transactionSearch}
              type={transactionTypeFilter}
              category={
                transactionCategoryFilter
              }
              currency={currency}
              money={money}
              dateText={dateText}
              onSearchChange={
                setTransactionSearch
              }
              onTypeChange={
                setTransactionTypeFilter
              }
              onCategoryChange={
                setTransactionCategoryFilter
              }
              onExport={
                exportTransactions
              }
              onEdit={
                startEditTransaction
              }
              onDelete={
                deleteTransaction
              }
            />
          </>
        )}

        {/* GOALS */}

        {page === "goals" && (
          <section className="content-grid">
            <GoalForm
              form={goalForm}
              onChange={setGoalForm}
              onSubmit={addGoal}
            />

            <GoalList
              goals={goals}
              contributions={
                goalContributions
              }
              currency={currency}
              money={money}
              dateText={dateText}
              daysUntil={daysUntil}
              onDelete={deleteGoal}
              onContribute={(goal) => {
                setContributionGoal(
                  goal
                );
                setContributionAmount(
                  ""
                );
                setContributionNote(
                  ""
                );
              }}
            />
          </section>
        )}

        {/* LEGACY SUBSCRIPTIONS */}

        {page ===
          "__legacy_subscriptions__" && (
          <section className="content-grid">
            {/* Legacy goal markup removed during component extraction. */}
          </section>
        )}

        {/* SUBSCRIPTIONS */}

        {page === "subscriptions" && (
          <section className="content-grid">
            <SubscriptionForm
              form={subscriptionForm}
              onChange={
                setSubscriptionForm
              }
              onSubmit={
                addSubscription
              }
            />

            <SubscriptionList
              items={subscriptions}
              total={subscriptionTotal}
              currency={currency}
              money={money}
              onDelete={
                deleteSubscription
              }
            />
          </section>
        )}

        {/* BUDGET */}

        {page === "budget" && (
          <section className="budget-page">
            <div className="panel budget-hero">
              <div className="coach-icon">
                ₺
              </div>

              <h2>
                {monthLabel(
                  selectedMonth
                )}{" "}
                Bütçen
              </h2>

              <strong>
                {money(
                  budget,
                  currency
                )}
              </strong>

              <p>
                Bu ayki kayıtlı giderin:{" "}
                <b>
                  {money(
                    totals.expense,
                    currency
                  )}
                </b>
              </p>

              <div className="progress large">
                <div
                  style={{
                    width: `${Math.min(
                      budgetUsage,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p>
                {budgetRemaining >= 0
                  ? "Kalan bütçe: "
                  : "Bütçe aşımı: "}

                <b>
                  {money(
                    Math.abs(
                      budgetRemaining
                    ),
                    currency
                  )}
                </b>
              </p>

              <div
                style={{
                  marginTop: "10px",
                }}
              >
                <strong
                  className={
                    budgetUsage > 100
                      ? "negative"
                      : budgetUsage >= 80
                      ? "warning"
                      : "positive"
                  }
                >
                  %{Math.round(
                    budgetUsage
                  )}{" "}
                  {budgetUsage > 100
                    ? "bütçe aşıldı"
                    : budgetUsage >= 80
                    ? "bütçenin %80'i üzeri kullanıldı"
                    : "kullanıldı"}
                </strong>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Kategori Bütçeleri</h2>
                  <p>
                    Her kategori için aylık harcama limiti belirle
                  </p>
                </div>
              </div>

              {(() => {
                const totalCategoryLimit =
                  CATEGORY_OPTIONS.reduce(
                    (sum, category) =>
                      sum +
                      Number(categoryLimits[category] || 0),
                    0
                  );

                const totalCategorySpent =
                  CATEGORY_OPTIONS.reduce(
                    (sum, category) =>
                      sum +
                      Number(
                        categoryTotals.find(
                          ([name]) => name === category
                        )?.[1] || 0
                      ),
                    0
                  );

                const totalCategoryUsage =
                  totalCategoryLimit > 0
                    ? (totalCategorySpent /
                        totalCategoryLimit) *
                      100
                    : 0;

                const totalCategoryRemaining =
                  totalCategoryLimit -
                  totalCategorySpent;

                return (
                  <>
                    {totalCategoryLimit > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <div className="stat-card">
                          <span>Toplam Limit</span>
                          <strong>
                            {money(
                              totalCategoryLimit,
                              currency
                            )}
                          </strong>
                        </div>

                        <div className="stat-card">
                          <span>Toplam Harcama</span>
                          <strong>
                            {money(
                              totalCategorySpent,
                              currency
                            )}
                          </strong>
                        </div>

                        <div className="stat-card">
                          <span>Toplam Kullanım</span>
                          <strong
                            className={
                              totalCategoryUsage >= 100
                                ? "negative"
                                : totalCategoryUsage >= 80
                                ? "warning"
                                : "positive"
                            }
                          >
                            %{Math.round(
                              totalCategoryUsage
                            )}
                          </strong>
                        </div>

                        <div className="stat-card">
                          <span>
                            {totalCategoryRemaining >= 0
                              ? "Toplam Kalan"
                              : "Toplam Aşım"}
                          </span>
                          <strong
                            className={
                              totalCategoryRemaining >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {money(
                              Math.abs(
                                totalCategoryRemaining
                              ),
                              currency
                            )}
                          </strong>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gap: "12px",
                        marginTop: "12px",
                      }}
                    >
                      {CATEGORY_OPTIONS.map((category) => {
                  const spent = Number(
                    categoryTotals.find(
                      ([name]) => name === category
                    )?.[1] || 0
                  );

                  const limit = Number(
                    categoryLimits[category] || 0
                  );

                  const inputValue =
                    categoryLimitInputs[category] ?? "";

                  const usage =
                    limit > 0
                      ? (spent / limit) * 100
                      : 0;

                  const remaining = limit - spent;

                  return (
                    <div
                      key={category}
                      style={{
                        padding: "14px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong>{category}</strong>

                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "13px",
                              opacity: 0.75,
                            }}
                          >
                            Harcanan:{" "}
                            {money(spent, currency)}

                            {limit > 0 && (
                              <span>
                                {" "}
                                • Limit:{" "}
                                {money(limit, currency)}
                              </span>
                            )}
                          </div>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveCategoryLimit(category);
                          }}
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Aylık limit"
                            value={inputValue}
                            onChange={(e) =>
                              setCategoryLimitInputs((prev) => ({
                                ...prev,
                                [category]: e.target.value,
                              }))
                            }
                            style={{
                              width: "150px",
                            }}
                          />

                          <button
                            type="submit"
                            className="primary-button"
                          >
                            Kaydet
                          </button>
                        </form>
                      </div>

                      {limit > 0 && (
                        <div>
                          <div
                            className="progress"
                            style={{
                              marginTop: "12px",
                            }}
                          >
                            <div
                              style={{
                                width:
                                  Math.min(usage, 100) + "%",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "10px",
                              marginTop: "7px",
                              fontSize: "13px",
                            }}
                          >
                            <span>
                              %{Math.round(usage)} kullanıldı
                            </span>

                            <strong
                              className={
                                usage >= 100
                                  ? "negative"
                                  : usage >= 80
                                  ? "warning"
                                  : "positive"
                              }
                            >
                              {remaining >= 0
                                ? "Kalan: " +
                                  money(
                                    remaining,
                                    currency
                                  )
                                : "Aşım: " +
                                  money(
                                    Math.abs(remaining),
                                    currency
                                  )}
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
          </div>
        </section>
        )}
        {/* REPORTS */}

        {page === "reports" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <span>
                  Toplam Gelir
                </span>

                <strong>
                  {money(
                    allTotals.income,
                    currency
                  )}
                </strong>

                <small>
                  Tüm kayıtlar
                </small>
              </div>

              <div className="stat-card">
                <span>
                  Toplam Gider
                </span>

                <strong>
                  {money(
                    allTotals.expense,
                    currency
                  )}
                </strong>

                <small>
                  Tüm kayıtlar
                </small>
              </div>

              <div className="stat-card">
                <span>
                  Net Durum
                </span>

                <strong
                  className={
                    allTotals.balance >=
                    0
                      ? "positive"
                      : "negative"
                  }
                >
                  {money(
                    allTotals.balance,
                    currency
                  )}
                </strong>

                <small>
                  Genel net bakiye
                </small>
              </div>

              <div className="stat-card">
                <span>
                  Abonelik
                </span>

                <strong>
                  {money(
                    subscriptionTotal,
                    currency
                  )}
                </strong>

                <small>
                  Aylık sabit yük
                </small>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      {monthLabel(
                        selectedMonth
                      )}{" "}
                      Özeti
                    </h2>

                    <p>
                      Seçilen ayın
                      finansal performansı
                    </p>
                  </div>
                </div>

                <div className="coach-stats">
                  <div>
                    <span>Gelir</span>

                    <strong>
                      {money(
                        totals.income,
                        currency
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Gider</span>

                    <strong>
                      {money(
                        totals.expense,
                        currency
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Tasarruf</span>

                    <strong>
                      {money(
                        totals.balance,
                        currency
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Oran</span>

                    <strong>
                      {Math.round(
                        savingsRate
                      )}
                      %
                    </strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      En Büyük Giderler
                    </h2>

                    <p>
                      Kategori bazında
                    </p>
                  </div>
                </div>

                {categoryTotals.length ===
                0 ? (
                  <div className="empty-state">
                    Veri yok.
                  </div>
                ) : (
                  <div className="category-list">
                    {categoryTotals
                      .slice(0, 6)
                      .map(
                        ([
                          category,
                          amount,
                        ]) => (
                          <div
                            className="category-row"
                            key={
                              category
                            }
                          >
                            <div className="category-info">
                              <strong>
                                {
                                  category
                                }
                              </strong>

                              <span>
                                {money(
                                  amount,
                                  currency
                                )}
                              </span>
                            </div>

                            <div className="progress">
                              <div
                                style={{
                                  width: `${Math.min(
                                    totals.expense >
                                      0
                                      ? (amount /
                                          totals.expense) *
                                          100
                                      : 0,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                  </div>
                )}
              </div>
            </section>

            <section className="panel trend-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Altı Aylık Trend
                  </h2>

                  <p>
                    Gelir, gider ve net durumunun değişimi
                  </p>
                </div>
              </div>

              <div className="trend-list">
                {monthlyTrend.map(
                  (item) => {
                    const maximum =
                      Math.max(
                        item.income,
                        item.expense,
                        1
                      );

                    return (
                      <div
                        className="trend-row"
                        key={item.month}
                      >
                        <div className="trend-label">
                          <strong>
                            {
                              item.label
                            }
                          </strong>

                          <span
                            className={
                              item.balance >=
                              0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {money(
                              item.balance,
                              currency
                            )}
                          </span>
                        </div>

                        <div className="trend-bars">
                          <div className="trend-bar-track">
                            <span
                              className="trend-bar income-bar"
                              style={{
                                width: `${Math.max(
                                  2,
                                  (item.income /
                                    maximum) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="trend-bar-track">
                            <span
                              className="trend-bar expense-bar"
                              style={{
                                width: `${Math.max(
                                  2,
                                  (item.expense /
                                    maximum) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="trend-values">
                          <span>
                            {money(
                              item.income,
                              currency
                            )}
                          </span>

                          <span>
                            {money(
                              item.expense,
                              currency
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="trend-legend">
                <span>
                  <i className="income-dot" />{" "}
                  Gelir
                </span>

                <span>
                  <i className="expense-dot" />{" "}
                  Gider
                </span>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Finansal İçgörüler
                  </h2>

                  <p>
                    Verilerinden çıkarılan
                    önemli noktalar
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "12px",
                }}
              >
                {financialInsights.map(
                  (item, index) => (
                    <div
                      key={index}
                      style={{
                        padding:
                          "16px",
                        borderRadius:
                          "14px",
                        background:
                          "rgba(0,0,0,.035)",
                      }}
                    >
                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* COACH */}

        {page === "coach" && (
          <section className="coach-page">
            <div className="coach-hero">
              <div className="coach-icon big">
                ✦
              </div>

              <div>
                <h2>
                  AI Finans Koçu{" "}
                  {isPremium &&
                    "PRO"}
                </h2>

                <p>
                  ParaAsistan verilerini
                  analiz ederek sana
                  kişisel finans önerileri
                  sunar.
                </p>
              </div>
            </div>

            {!isPremium && (
              <div className="panel">
                <h3>
                  Premium özellik
                </h3>

                <p>
                  AI Finans Koçu
                  ParaAsistan'ın premium
                  özelliklerinden biridir.
                </p>

                <button
                  className="secondary-button"
                  onClick={() =>
                    navigate(
                      "premium"
                    )
                  }
                >
                  Premium'u İncele
                </button>
              </div>
            )}

            <div className="coach-quick-actions">
              <button
                onClick={() =>
                  askCoach(
                    "Bu ay finansal durumumdaki en önemli problemi bul."
                  )
                }
              >
                Finansımı analiz et
              </button>

              <button
                onClick={() =>
                  askCoach(
                    "Giderlerimi analiz et ve nereden tasarruf edebileceğimi söyle."
                  )
                }
              >
                Tasarruf önerisi
              </button>

              <button
                onClick={() =>
                  askCoach(
                    "Bütçemi değerlendir ve ay sonuna kadar ne yapmam gerektiğini söyle."
                  )
                }
              >
                Bütçemi değerlendir
              </button>

              <button
                onClick={() =>
                  askCoach(
                    "Finansal hedeflerime ulaşmam için bana bir plan oluştur."
                  )
                }
              >
                Hedef planı oluştur
              </button>
            </div>

            <div className="panel coach-chat">
              <div className="panel-header">
                <div>
                  <h2>
                    Finans Koçuna Sor
                  </h2>

                  <p>
                    Finansal durumunla
                    ilgili istediğin soruyu
                    yaz.
                  </p>
                </div>
              </div>

              <div className="coach-input">
                <textarea
                  value={
                    coachQuestion
                  }
                  maxLength={1000}
                  onChange={(e) =>
                    setCoachQuestion(
                      e.target.value
                    )
                  }
                  placeholder="Örneğin: Bu ay giderlerimi nasıl azaltabilirim?"
                  rows={4}
                />

                <button
                  className="primary-button"
                  onClick={() =>
                    askCoach()
                  }
                  disabled={
                    coachLoading
                  }
                >
                  {coachLoading
                    ? "AI düşünüyor..."
                    : "Koça Sor"}
                </button>
              </div>

              {coachError && (
                <div className="error-box">
                  {coachError}
                </div>
              )}

              {coachLoading && (
                <div className="ai-loading">
                  <div className="spinner" />

                  <span>
                    Finansal verilerin
                    analiz ediliyor...
                  </span>
                </div>
              )}

              {coachAnswer &&
                !coachLoading && (
                  <div className="ai-answer">
                    <div className="ai-answer-title">
                      <span>✦</span>
                      ParaAsistan AI
                    </div>

                    <div className="ai-answer-text">
                      {coachAnswer
                        .split("\n")
                        .map(
                          (
                            line,
                            index
                          ) => (
                            <p
                              key={
                                index
                              }
                            >
                              {line ||
                                "\u00A0"}
                            </p>
                          )
                        )}
                    </div>
                  </div>
                )}

              {coachHistory.length > 1 && (
                <details className="coach-history">
                  <summary>
                    Son koç görüşmeleri
                  </summary>

                  <div className="coach-history-list">
                    {coachHistory
                      .slice(1)
                      .map((item) => (
                        <button
                          type="button"
                          key={
                            item.id
                          }
                          onClick={() => {
                            setCoachQuestion(
                              item.question
                            );
                            setCoachAnswer(
                              item.answer
                            );
                          }}
                        >
                          {
                            item.question
                          }
                        </button>
                      ))}
                  </div>
                </details>
              )}
            </div>

            <div className="coach-stats">
              <div>
                <span>Gelir</span>

                <strong>
                  {money(
                    totals.income,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>Gider</span>

                <strong>
                  {money(
                    totals.expense,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>Bakiye</span>

                <strong>
                  {money(
                    totals.balance,
                    currency
                  )}
                </strong>
              </div>

              <div>
                <span>Abonelik</span>

                <strong>
                  {money(
                    subscriptionTotal,
                    currency
                  )}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* PROFILE */}

        {page === "profile" && (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Profil Bilgileri
                  </h2>

                  <p>
                    Kişisel bilgilerini
                    güncelle.
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  saveProfile
                }
                className="form-grid"
              >
                <label>
                  Ad Soyad

                  <input
                    value={
                      profileForm.full_name
                    }
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        full_name:
                          e.target
                            .value,
                      })
                    }
                    placeholder="Adınız Soyadınız"
                  />
                </label>

                <label>
                  E-posta

                  <input
                    value={
                      session.user
                        .email || ""
                    }
                    disabled
                  />

                  <small>
                    E-posta adresi giriş
                    hesabına bağlıdır.
                  </small>
                </label>

                <label>
                  Telefon

                  <input
                    value={
                      profileForm.phone
                    }
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phone:
                          e.target
                            .value,
                      })
                    }
                    placeholder="05xx xxx xx xx"
                  />
                </label>

                <label>
                  Para Birimi

                  <select
                    value={
                      profileForm.currency
                    }
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        currency:
                          e.target
                            .value,
                      })
                    }
                  >
                    <option value="TRY">
                      Türk Lirası (₺)
                    </option>

                    <option value="USD">
                      Amerikan Doları ($)
                    </option>

                    <option value="EUR">
                      Euro (€)
                    </option>
                  </select>
                </label>

                <label>
                  Aylık Gelir Hedefi

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      profileForm.monthly_income_target
                    }
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        monthly_income_target:
                          e.target
                            .value,
                      })
                    }
                    placeholder="0"
                  />
                </label>

                <button
                  className="primary-button"
                  disabled={
                    profileSaving
                  }
                >
                  {profileSaving
                    ? "Kaydediliyor..."
                    : "Profili Kaydet"}
                </button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Hesap Özeti
                  </h2>

                  <p>
                    ParaAsistan hesabının
                    durumu
                  </p>
                </div>
              </div>

              <div className="coach-stats">
                <div>
                  <span>
                    Üyelik
                  </span>

                  <strong>
                    {isPremium
                      ? "Premium"
                      : "Free"}
                  </strong>
                </div>

                <div>
                  <span>
                    İşlem
                  </span>

                  <strong>
                    {
                      transactions.length
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Hedef
                  </span>

                  <strong>
                    {goals.length}
                  </strong>
                </div>

                <div>
                  <span>
                    Abonelik
                  </span>

                  <strong>
                    {
                      subscriptions.length
                    }
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "24px",
                }}
              >
                <p>
                  Hesap oluşturma:
                </p>

                <strong>
                  {dateText(
                    session.user
                      .created_at
                  )}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* PREMIUM */}

        {page === "premium" && (
          <section className="coach-page">
            <div className="panel budget-hero">
              <div className="coach-icon big">
                ★
              </div>

              <h2>
                ParaAsistan Premium
              </h2>

              <strong>
                {isPremium
                  ? "Premium Üyesin"
                  : "Daha Akıllı Finans Yönetimi"}
              </strong>

              <p>
                {isPremium
                  ? "Premium özelliklerini kullanmaya hazırsın."
                  : "Gelişmiş finansal analiz, AI koç ve premium deneyim için hazırlan."}
              </p>

              {!isPremium && (
                <button
                  className="primary-button"
                  onClick={() =>
                    showToast(
                      "Gerçek ödeme altyapısı henüz bağlanmadı. Premium üyelik yalnızca güvenli ödeme sistemi üzerinden aktive edilecek."
                    )
                  }
                >
                  Premium'a Geç
                </button>
              )}
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      Free
                    </h2>

                    <p>
                      Temel finans
                      yönetimi
                    </p>
                  </div>
                </div>

                <div className="category-list">
                  {[
                    "Gelir / Gider",
                    "Finansal Hedefler",
                    "Abonelik Takibi",
                    "Bütçe Yönetimi",
                    "Temel Raporlar",
                  ].map(
                    (feature) => (
                      <div
                        className="category-row"
                        key={
                          feature
                        }
                      >
                        <div className="category-info">
                          <strong>
                            ✓{" "}
                            {feature}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>
                      ⭐ Premium
                    </h2>

                    <p>
                      Gelişmiş finans
                      deneyimi
                    </p>
                  </div>
                </div>

                <div className="category-list">
                  {[
                    "Gelişmiş Finans Analizleri",
                    "Gelişmiş Raporlar",
                    "AI Finans Koçu",
                    "Premium Dashboard",
                    "Gelecekte özel premium özellikler",
                  ].map(
                    (feature) => (
                      <div
                        className="category-row"
                        key={
                          feature
                        }
                      >
                        <div className="category-info">
                          <strong>
                            ✓{" "}
                            {feature}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Üyelik Durumu
                  </h2>

                  <p>
                    Hesabındaki mevcut
                    üyelik bilgileri
                  </p>
                </div>
              </div>

              <div className="coach-stats">
                <div>
                  <span>
                    Paket
                  </span>

                  <strong>
                    {membership?.plan ===
                    "premium"
                      ? "Premium"
                      : "Free"}
                  </strong>
                </div>

                <div>
                  <span>
                    Durum
                  </span>

                  <strong>
                    {membership?.status ===
                    "active"
                      ? "Aktif"
                      : membership?.status ||
                        "Aktif"}
                  </strong>
                </div>

                <div>
                  <span>
                    Başlangıç
                  </span>

                  <strong>
                    {membership?.started_at
                      ? dateText(
                          membership.started_at
                        )
                      : "-"}
                  </strong>
                </div>

                <div>
                  <span>
                    Bitiş
                  </span>

                  <strong>
                    {membership?.expires_at
                      ? dateText(
                          membership.expires_at
                        )
                      : "Süresiz"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* EDIT TRANSACTION MODAL */}

        <EditTransactionModal
          transaction={
            editingTransaction
          }
          categories={
            CATEGORY_OPTIONS
          }
          onChange={
            setEditingTransaction
          }
          onSubmit={
            updateTransaction
          }
          onClose={
            cancelEditTransaction
          }
        />

        {/* GOAL CONTRIBUTION MODAL */}

        <GoalContributionModal
          goal={contributionGoal}
          amount={contributionAmount}
          note={contributionNote}
          currency={currency}
          money={money}
          onAmountChange={
            setContributionAmount
          }
          onNoteChange={
            setContributionNote
          }
          onSubmit={
            addGoalContribution
          }
          onClose={() =>
            setContributionGoal(null)
          }
        />
      </main>
    </div>
  );
}

export default App;





