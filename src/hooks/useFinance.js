// src/hooks/useFinance.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useFinance() {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const addEntry = async (desc, amount, type) => {
    const { error } = await supabase.from('transactions').insert([{ description: desc, amount, type }]);
    if (!error) fetchTransactions();
  };

  const removeEntry = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchTransactions();
  };

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += Number(t.amount);
    else acc.expense += Number(t.amount);
    return acc;
  }, { income: 0, expense: 0 });

  return { transactions, totals, addEntry, removeEntry, refresh: fetchTransactions };
}