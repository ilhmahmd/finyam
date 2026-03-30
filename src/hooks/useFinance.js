import { useState, useEffect } from 'react';

export const useFinance = () => {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('finyam_ledger');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('finyam_ledger', JSON.stringify(transactions));
  }, [transactions]);

  const totals = transactions.reduce(
    (acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const addEntry = (desc, amount, type) => {
    const newEntry = {
      id: crypto.randomUUID(),
      desc,
      amount: Number(amount),
      type,
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newEntry, ...prev]);
  };

  const removeEntry = (id) => {
    setTransactions(prev => prev.filter(item => item.id !== id));
  };

  return { transactions, totals, addEntry, removeEntry };
};