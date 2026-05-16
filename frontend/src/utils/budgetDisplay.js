export function getBudgetBalance(remainingAmount) {
  const numeric = Number(remainingAmount || 0);

  return {
    amount: Math.abs(numeric),
    label: numeric < 0 ? "Over Budget" : "Remaining",
    sentence: numeric < 0 ? "over budget" : "remaining",
  };
}
