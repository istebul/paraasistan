import { useState } from "react";

const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function MonthPicker({
  value,
  label,
  onChange,
}) {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const [open, setOpen] = useState(false);

  const chooseMonth = (nextMonthIndex) => {
    onChange(
      `${year}-${String(nextMonthIndex + 1).padStart(2, "0")}`
    );
    setOpen(false);
  };

  const changeYear = (offset) => {
    onChange(
      `${year + offset}-${String(monthIndex + 1).padStart(2, "0")}`
    );
  };

  return (
    <div className="month-picker">
      <button
        type="button"
        className="month-picker-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>{label}</span>
        <span aria-hidden="true">▦</span>
      </button>

      {open && (
        <div
          className="month-picker-popover"
          role="dialog"
          aria-label="Ay seçin"
        >
          <div className="month-picker-year">
            <button
              type="button"
              aria-label="Önceki yıl"
              onClick={() => changeYear(-1)}
            >
              ‹
            </button>
            <strong>{year}</strong>
            <button
              type="button"
              aria-label="Sonraki yıl"
              onClick={() => changeYear(1)}
            >
              ›
            </button>
          </div>

          <div className="month-grid">
            {MONTH_NAMES.map((monthName, index) => (
              <button
                type="button"
                key={monthName}
                className={index === monthIndex ? "active" : ""}
                onClick={() => chooseMonth(index)}
              >
                {monthName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
