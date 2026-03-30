import React, { useState, useMemo, useRef, useEffect } from 'react'; // Tambah useEffect
import { useFinance } from './hooks/useFinance';
import { formatIDR, formatDate } from './utils/formatters';
import { Plus, Trash2, TrendingUp, TrendingDown, Target, Calendar, X, Edit2, Check } from 'lucide-react';

export default function App() {
  const { transactions, totals, addEntry, removeEntry } = useFinance();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [filterDate, setFilterDate] = useState('');
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // --- PERSISTENCE LOGIC FOR GOALS ---
  // Ambil data dari localStorage saat pertama kali load
  const [goalName, setGoalName] = useState(() => {
    return localStorage.getItem('finyam_goal_name') || 'Setup RTX PC';
  });
  
  const [goalTarget, setGoalTarget] = useState(() => {
    const savedTarget = localStorage.getItem('finyam_goal_target');
    return savedTarget ? Number(savedTarget) : 15000000;
  });

  // Simpan otomatis setiap kali goalName atau goalTarget berubah
  useEffect(() => {
    localStorage.setItem('finyam_goal_name', goalName);
    localStorage.setItem('finyam_goal_target', goalTarget);
  }, [goalName, goalTarget]);
  // -----------------------------------

  const balance = totals.income - totals.expense;
  const progress = Math.min(Math.max((balance / goalTarget) * 100, 0), 100);
  const dateInputRef = useRef(null);
  const goalRef = useRef(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterDate === '') return true;
      const tDate = new Date(t.date);
      const selectedDate = new Date(filterDate);
      return tDate.toDateString() === selectedDate.toDateString();
    });
  }, [transactions, filterDate]);

  const handleAction = (e) => {
    e.preventDefault();
    if (!desc || !amount || amount <= 0) return;
    addEntry(desc, amount, type);
    setDesc('');
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] transition-colors duration-300 font-sans">
      
      {/* NAVBAR - Centered Logo */}
      <nav className="bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-[#1F1F1F] shadow-tiny sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
            <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
              fin<span className="font-light text-gray-400 dark:text-gray-500">.yam</span>
            </h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ASIDE: STATS & FORM */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F] shadow-tiny transition-colors">
              <h2 className="text-[11px] text-gray-400 font-bold mb-6 uppercase tracking-[0.2em]">Total Balance</h2>
              <p className={`text-3xl font-bold tracking-tighter break-all ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-500'}`}>
                {formatIDR(balance)}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-[#1F1F1F]">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-widest">Inflow</p>
                  <p className="text-sm font-semibold text-green-600 truncate">{formatIDR(totals.income)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1 uppercase tracking-widest">Outflow</p>
                  <p className="text-sm font-semibold text-red-500 truncate">{formatIDR(totals.expense)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F] shadow-tiny transition-colors">
              <h3 className="text-[11px] text-gray-400 font-bold mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                <Plus size={14} strokeWidth={3} /> Quick Add
              </h3>
              <form onSubmit={handleAction} className="space-y-6">
                <div className="relative group">
                  <input className="w-full border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 pt-6 outline-none focus:border-black dark:focus:border-white transition-all bg-transparent dark:text-white text-sm placeholder:text-gray-300 dark:placeholder:text-gray-600 font-medium" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Misal: Gaji Freelance" />
                  <label className="absolute left-4 top-2 text-[9px] uppercase tracking-widest text-gray-400 font-bold">Keterangan</label>
                </div>
                <div className="relative group">
                  <input type="number" className="w-full border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 pt-6 outline-none focus:border-black dark:focus:border-white transition-all bg-transparent dark:text-white font-medium text-2xl tracking-tight" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
                  <label className="absolute left-4 top-2 text-[9px] uppercase tracking-widest text-gray-400 font-bold">Nominal</label>
                </div>
                <div className="flex bg-gray-50 dark:bg-[#0D0D0D] border border-gray-100 dark:border-[#1F1F1F] rounded-xl p-1 gap-1">
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${type === 'income' ? 'bg-white dark:bg-[#1A1A1A] text-green-600 shadow-sm' : 'text-gray-400'}`}>Income</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${type === 'expense' ? 'bg-white dark:bg-[#1A1A1A] text-red-500 shadow-sm' : 'text-gray-400'}`}>Expense</button>
                </div>
                <button className="w-full bg-black dark:bg-white dark:text-black text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all">Add Transaction</button>
              </form>
            </div>
          </aside>

          {/* RIGHT: LEDGER & GOAL */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* RIWAYAT CARD */}
            <section className="bg-white dark:bg-[#111111] p-5 sm:p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F] shadow-tiny h-auto transition-colors">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-[#1F1F1F]">
                <h2 className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">Transaction History</h2>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 dark:bg-[#0D0D0D] px-2 py-0.5 rounded uppercase">{filteredTransactions.length} items</span>
                    <div className="relative group" onClick={() => dateInputRef.current.showPicker()}>
                      <Calendar size={18} className="text-gray-400 dark:text-white cursor-pointer hover:opacity-70 transition-all" strokeWidth={2.5} />
                      <input ref={dateInputRef} type="date" onChange={(e) => setFilterDate(e.target.value)} value={filterDate} className="absolute inset-0 w-full h-full opacity-0 pointer-events-none" />
                    </div>
                    {filterDate && <button onClick={() => setFilterDate('')} className="text-red-500 p-1"><X size={14} /></button>}
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="p-4 sm:p-5 border border-gray-100 dark:border-[#1F1F1F] rounded-xl flex items-center justify-between group hover:border-black dark:hover:border-white transition-all bg-white dark:bg-[#111111]">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`p-2 rounded-xl shrink-0 ${t.type === 'income' ? 'bg-green-50 dark:bg-green-950/20 text-green-600' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
                        {t.type === 'income' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{formatDate(t.date)}</span>
                        <span className="text-sm font-semibold text-black dark:text-white capitalize truncate">{t.desc}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <span className={`text-sm font-bold tracking-tight ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                      </span>
                      <button onClick={() => removeEntry(t.id)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 p-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* GOAL CARD */}
            <section ref={goalRef} className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F] shadow-tiny transition-colors">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-[#1F1F1F]">
                <h2 className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                   <Target size={14} strokeWidth={2.5}/> Savings Goal
                </h2>
                <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  {isEditingGoal ? <Check size={18} className="text-green-500" /> : <Edit2 size={16} />}
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                  <div className="flex-1 w-full">
                    {isEditingGoal ? (
                      <input autoFocus className="bg-transparent text-xl font-bold dark:text-white outline-none border-b border-black dark:border-white w-full pb-1" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
                    ) : (
                      <p className="text-xl font-bold text-black dark:text-white tracking-tight">{goalName}</p>
                    )}
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Active Target</p>
                  </div>
                  
                  <div className="text-right w-full sm:w-auto">
                    {isEditingGoal ? (
                      <input type="number" className="bg-transparent text-right text-xl font-bold dark:text-white outline-none border-b border-black dark:border-white w-32 pb-1" value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} />
                    ) : (
                      <p className="text-xl font-bold text-black dark:text-white tracking-tight">{formatIDR(goalTarget)}</p>
                    )}
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Price Requirement</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                   <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-black dark:text-white tracking-tighter leading-none">{Math.round(progress)}%</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Progress achieved</span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-50 dark:bg-[#0D0D0D] rounded-full overflow-hidden border border-gray-100 dark:border-white/5">
                      <div className="h-full bg-black dark:bg-white transition-all duration-1000 ease-in-out" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="text-center py-10 mt-10 border-t border-gray-100 dark:border-[#1F1F1F]">
        <p className="text-[11px] text-gray-300 dark:text-gray-700 font-medium tracking-[0.2em]">fin.yam • 2026</p>
      </footer>
    </div>
  );
}