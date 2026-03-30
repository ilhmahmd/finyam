import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
import { supabase } from './lib/supabaseClient';
import { formatIDR, formatDate } from './utils/formatters';
import { Plus, Trash2, TrendingUp, TrendingDown, Target, Calendar, X, Edit2, Check, Lock } from 'lucide-react';

export default function App() {
  const { transactions, totals, addEntry, removeEntry } = useFinance();
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [filterDate, setFilterDate] = useState('');
  
  // Auth & Settings States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [savedPin, setSavedPin] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Reset PIN States
  const [showResetModal, setShowResetModal] = useState(false);
  const [secretAnswer, setSecretAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetStep, setResetStep] = useState(1);

  // Goal States
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalName, setGoalName] = useState('Loading...');
  const [goalTarget, setGoalTarget] = useState(0);

  // Delete States (Now storing the WHOLE object)
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (data) {
      setGoalName(data.goal_name);
      setGoalTarget(data.goal_target);
      setSavedPin(data.pin_code);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    if (pinInput.length === 4) {
      if (pinInput === savedPin) {
        setIsAuthenticated(true);
        setIsError(false);
      } else {
        setIsError(true);
        setTimeout(() => { setPinInput(''); setIsError(false); }, 1500);
      }
    }
  }, [pinInput, savedPin]);

  const handleResetPin = async () => {
    if (newPin.length !== 4) return;
    const { error } = await supabase.from('settings').update({ pin_code: newPin }).eq('id', 1);
    if (!error) {
      setSavedPin(newPin); setPinInput(''); setShowResetModal(false);
      setResetStep(1); setSecretAnswer(''); setNewPin('');
    }
  };

  const handleUpdateGoal = async () => {
    if (isEditingGoal) {
      await supabase.from('settings').update({ goal_name: goalName, goal_target: Number(goalTarget) }).eq('id', 1);
    }
    setIsEditingGoal(!isEditingGoal);
  };

  const balance = totals.income - totals.expense;
  const progress = Math.min(Math.max((balance / (goalTarget || 1)) * 100, 0), 100);
  const dateInputRef = useRef(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterDate === '') return true;
      const tDate = t.date ? new Date(t.date) : new Date(t.created_at);
      return tDate.toDateString() === new Date(filterDate).toDateString();
    });
  }, [transactions, filterDate]);

  const handleAction = (e) => {
    e.preventDefault();
    if (!desc || !amount || amount <= 0) return;
    addEntry(desc, amount, type);
    setDesc(''); setAmount('');
  };

  // --- LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 font-sans relative">
        <div className="flex flex-col items-center z-10 w-full max-w-xs">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
            <Lock className="text-white dark:text-black" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tighter mb-2 dark:text-white">fin.yam</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-16">Enter Secure PIN</p>
          
          <div className="flex gap-4 relative mb-12">
            <input autoFocus type="text" pattern="\d*" inputMode="numeric" maxLength={4} value={pinInput} onChange={(e) => !isError && setPinInput(e.target.value.replace(/\D/g, ''))} className="absolute inset-0 w-full h-full opacity-0 z-20" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`w-14 h-16 rounded-xl border flex items-center justify-center transition-all duration-300 ${isError ? 'border-red-500 bg-red-50' : pinInput.length === i ? 'border-black dark:border-white' : 'border-gray-100 dark:border-[#1F1F1F]'}`}>
                {pinInput.length > i ? <div className={`w-2.5 h-2.5 rounded-full animate-popIn ${isError ? 'bg-red-500' : 'bg-black dark:bg-white'}`}></div> : <div className="w-2 h-2 bg-gray-100 dark:bg-[#1F1F1F] rounded-full"></div>}
              </div>
            ))}
          </div>
          <div className="h-6 mb-8">{isError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest animate-shake">Invalid PIN</p>}</div>
          <button onClick={() => setShowResetModal(true)} className="text-[9px] font-bold uppercase tracking-widest text-gray-300 hover:text-black dark:hover:text-white transition-colors">Forgot PIN?</button>
        </div>

        {showResetModal && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-black flex flex-col items-center justify-center p-6 animate-fade-in">
            <button onClick={() => {setShowResetModal(false); setResetStep(1);}} className="absolute top-8 right-8 p-2 text-gray-300 hover:text-black dark:hover:text-white"><X size={20} /></button>
            <div className="w-full max-w-lg space-y-16">
              {resetStep === 1 ? (
                <div className="space-y-12">
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-bold">Security Verification</p>
                    <h2 className="text-4xl font-extrabold dark:text-white tracking-tighter">Siapa nama hewan kamu?</h2>
                  </div>
                  <input autoFocus className="w-full bg-transparent border-b border-gray-100 dark:border-[#1F1F1F] py-5 outline-none text-3xl font-bold dark:text-white uppercase" placeholder="Type Answer..." value={secretAnswer} onChange={(e) => { setSecretAnswer(e.target.value); if (e.target.value.toLowerCase() === 'jamal') setTimeout(() => setResetStep(2), 600); }} />
                </div>
              ) : (
                <div className="space-y-12">
                  <h2 className="text-4xl font-extrabold dark:text-white tracking-tighter">Set New PIN</h2>
                  <div className="flex gap-4 relative">
                    <input autoFocus type="text" pattern="\d*" inputMode="numeric" maxLength={4} className="absolute inset-0 w-full h-full opacity-0 z-20" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} />
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-14 h-16 rounded-xl border flex items-center justify-center ${newPin.length === i ? 'border-black dark:border-white' : 'border-gray-100 dark:border-[#1F1F1F]'}`}>
                        {newPin.length > i ? <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full"></div> : <div className="w-2 h-2 bg-gray-100 dark:bg-[#1F1F1F] rounded-full"></div>}
                      </div>
                    ))}
                  </div>
                  <button disabled={newPin.length !== 4} onClick={handleResetPin} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-10">Confirm New PIN</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] font-sans transition-colors">
      <nav className="bg-white dark:bg-[#111111] border-b border-gray-100 dark:border-[#1F1F1F] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="w-10"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-black dark:bg-white rounded-full"></div>
            <h1 className="text-xl font-bold tracking-tight dark:text-white">fin<span className="font-light text-gray-400">.yam</span></h1>
          </div>
          <button onClick={() => { setIsAuthenticated(false); setPinInput(''); }} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 dark:border-[#1F1F1F] text-gray-400 hover:text-black dark:hover:text-white transition-all"><Lock size={18} /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F] shadow-tiny">
            <h2 className="text-[11px] text-gray-400 font-bold mb-6 uppercase tracking-[0.2em]">Total Balance</h2>
            <p className={`text-3xl font-bold tracking-tighter ${balance >= 0 ? 'text-black dark:text-white' : 'text-red-500'}`}>{formatIDR(balance)}</p>
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-[#1F1F1F]">
              <div><p className="text-[10px] text-gray-400 uppercase mb-1">Inflow</p><p className="text-sm font-semibold text-green-600 truncate">{formatIDR(totals.income)}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase mb-1">Outflow</p><p className="text-sm font-semibold text-red-500 truncate">{formatIDR(totals.expense)}</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F]">
            <h3 className="text-[11px] text-gray-400 font-bold mb-6 uppercase tracking-[0.2em] flex items-center gap-2"><Plus size={14} /> Quick Add</h3>
            <form onSubmit={handleAction} className="space-y-6">
              <div className="relative group">
                <input className="w-full border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 pt-6 outline-none bg-transparent dark:text-white text-sm" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Misal: Gaji Freelance" />
                <label className="absolute left-4 top-2 text-[9px] uppercase tracking-widest text-gray-400 font-bold">Keterangan</label>
              </div>
              <div className="relative group">
                <input type="number" className="w-full border border-gray-200 dark:border-[#1F1F1F] rounded-xl p-4 pt-6 outline-none bg-transparent dark:text-white font-medium text-2xl" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
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

        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F]">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-[#1F1F1F]">
              <h2 className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">Transaction History</h2>
              <div className="flex items-center gap-3">
                <div className="relative group" onClick={() => dateInputRef.current.showPicker()}>
                  <Calendar size={18} className="text-gray-400 cursor-pointer" />
                  <input ref={dateInputRef} type="date" onChange={(e) => setFilterDate(e.target.value)} value={filterDate} className="absolute inset-0 opacity-0 pointer-events-none" />
                </div>
                {filterDate && <button onClick={() => setFilterDate('')} className="text-red-500"><X size={14} /></button>}
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="p-5 border border-gray-100 dark:border-[#1F1F1F] rounded-xl flex items-center justify-between group hover:border-black dark:hover:border-white transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-green-50 dark:bg-green-950/20 text-green-600' : 'bg-red-50 dark:bg-red-950/20 text-red-500'}`}>
                      {t.type === 'income' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-black dark:text-white capitalize truncate">{t.description || 'No Description'}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(t.date || t.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}</span>
                    <button onClick={() => { setTransactionToDelete(t); setShowDeleteModal(true); }} className="text-gray-300 hover:text-red-500 p-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-[#111111] p-7 rounded-2xl border border-gray-100 dark:border-[#1F1F1F]">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-[#1F1F1F]">
              <h2 className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2"><Target size={14}/> Savings Goal</h2>
              <button onClick={handleUpdateGoal} className="text-gray-400 hover:text-black dark:hover:text-white">{isEditingGoal ? <Check size={18} className="text-green-500" /> : <Edit2 size={16} />}</button>
            </div>
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-end gap-6">
                <div className="flex-1 w-full">
                  {isEditingGoal ? <input autoFocus className="bg-transparent text-xl font-bold dark:text-white outline-none border-b border-black w-full pb-1" value={goalName} onChange={(e) => setGoalName(e.target.value)} /> : <p className="text-xl font-bold dark:text-white">{goalName}</p>}
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Active Target</p>
                </div>
                <div className="text-right w-full sm:w-auto">
                  {isEditingGoal ? <input type="number" className="bg-transparent text-right text-xl font-bold dark:text-white outline-none border-b border-black w-32 pb-1" value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} /> : <p className="text-xl font-bold dark:text-white">{formatIDR(goalTarget)}</p>}
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Requirement</p>
                </div>
              </div>
              <div className="space-y-3 pt-4">
                 <div className="flex justify-between items-end"><span className="text-3xl font-bold dark:text-white tracking-tighter">{Math.round(progress)}%</span><span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Progress achieved</span></div>
                 <div className="w-full h-1.5 bg-gray-50 dark:bg-[#0D0D0D] rounded-full overflow-hidden"><div className="h-full bg-black dark:bg-white transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="text-center py-10 opacity-30 text-[11px] font-bold uppercase tracking-[0.3em]">fin.yam • 2026</footer>

      {/* DELETE MODAL (MENTION NAME) */}
      {showDeleteModal && transactionToDelete && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-[300px] bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#1F1F1F] p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto"><Trash2 size={20} /></div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold dark:text-white uppercase tracking-[0.2em]">Delete Transaction?</h3>
              <div className="py-3 px-4 bg-gray-50 dark:bg-[#0D0D0D] rounded-2xl border border-gray-100 dark:border-[#1F1F1F]">
                <p className="text-sm font-bold dark:text-white capitalize truncate">{transactionToDelete.description}</p>
                <p className={`text-[10px] font-bold mt-1 ${transactionToDelete.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>{transactionToDelete.type === 'income' ? '+' : '-'} {formatIDR(transactionToDelete.amount)}</p>
              </div>
              <p className="text-[9px] text-gray-400 uppercase tracking-tight">This action cannot be undone.</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => { removeEntry(transactionToDelete.id); setShowDeleteModal(false); setTransactionToDelete(null); }} className="w-full bg-red-500 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 shadow-lg shadow-red-500/20">Confirm Delete</button>
              <button onClick={() => { setShowDeleteModal(false); setTransactionToDelete(null); }} className="w-full text-gray-400 py-3 text-[10px] font-bold uppercase tracking-widest hover:text-black dark:hover:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}