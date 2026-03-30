import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useFinance() {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTransactions(data);
  };

  useEffect(() => { 
    fetchTransactions(); 
  }, []);

  const addEntry = async (description, amount, type) => {
    const { error } = await supabase
      .from('transactions')
      .insert([{ 
        description: description, 
        amount: Number(amount), 
        type: type 
      }]);
    
    if (!error) fetchTransactions();
    else console.error("Error adding entry:", error.message);
  };

  const removeEntry = async (id) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (!error) fetchTransactions();
    else console.error("Error removing entry:", error.message);
  };

  const totals = transactions.reduce((acc, t) => {
    const val = Number(t.amount) || 0;
    if (t.type === 'income') acc.income += val;
    else acc.expense += val;
    return acc;
  }, { income: 0, expense: 0 });

  return { transactions, totals, addEntry, removeEntry, refresh: fetchTransactions };
}