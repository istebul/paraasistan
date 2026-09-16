const positiveAmount = (value, label) => {
  const amount = Number(value);

  if (!value || Number.isNaN(amount) || amount <= 0) {
    return `${label} 0'dan büyük olmalı.`;
  }

  return "";
};

export const validateTransaction = (form) => {
  if (!form.title?.trim()) return "İşlem açıklaması gerekli.";
  if (!form.date) return "İşlem tarihi gerekli.";
  return positiveAmount(form.amount, "İşlem tutarı");
};

export const validateGoal = (form) => {
  if (!form.title?.trim()) return "Hedef adı gerekli.";

  const targetError = positiveAmount(form.target, "Hedef tutarı");
  if (targetError) return targetError;

  const saved = Number(form.saved || 0);
  const target = Number(form.target);

  if (Number.isNaN(saved) || saved < 0) {
    return "Birikmiş tutar negatif olamaz.";
  }

  if (saved > target) {
    return "Birikmiş tutar hedef tutarını aşamaz.";
  }

  return "";
};

export const validateSubscription = (form) => {
  if (!form.title?.trim()) return "Abonelik adı gerekli.";

  const amountError = positiveAmount(
    form.amount,
    "Abonelik tutarı"
  );
  if (amountError) return amountError;

  const day = Number(form.day);
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return "Ödeme günü 1 ile 31 arasında olmalı.";
  }

  return "";
};

export const validateBudget = (value) => {
  const amount = Number(value);

  if (Number.isNaN(amount) || amount < 0) {
    return "Bütçe 0 veya daha büyük olmalı.";
  }

  return "";
};
