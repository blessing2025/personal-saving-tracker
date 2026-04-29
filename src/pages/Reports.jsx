import React, { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNumberFormatter } from 'react-aria';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { db } from '../lib/db'; // This line is not the target
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { TrendingUp, FileDown, Activity, Zap, AlertTriangle, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Reports() {
  const { t, profile, formatDate } = useTranslation();
  const { user } = useAuth();
  const barChartRef = useRef(null);

  const formatter = useNumberFormatter({
    style: 'currency',
    currency: profile?.currency === 'FCAF' ? 'XOF' : profile?.currency || 'USD',
    currencyDisplay: 'symbol'
  });

  // Fetch raw data using useLiveQuery for reactivity
  const incomes = useLiveQuery(() => db.incomes.where('user_id').equals(user?.id || '').filter(item => !item._deleted).toArray(), [user]);
  const expenses = useLiveQuery(() => db.expenses.where('user_id').equals(user?.id || '').filter(item => !item._deleted).toArray(), [user]);

  // Calculations derived directly from live query data
  const totalIncome = incomes?.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) || 0;
  const totalExpense = expenses?.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) || 0;
  const netSavings = totalIncome - totalExpense;
  const ratio = totalExpense > 0 ? (totalIncome / totalExpense).toFixed(2) : totalIncome > 0 ? '∞' : '0.00';
  
  const liquidityScore = Math.min(Math.round((totalIncome / (totalExpense || 1)) * 50), 100);
  
  // Calculate dynamic Growth Vector (Savings Rate) and Liability Count
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : "0.0";
  const flaggedLiabilities = expenses?.filter(e => e.amount > 500).length || 0;

  const recentActivity = [
    ...(incomes || []).map(i => ({ ...i, type: 'income' })),
    ...(expenses || []).map(e => ({ ...e, type: 'expense' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  const chartData = [
    { name: t('income'), value: totalIncome },
    { name: t('expenses'), value: totalExpense }
  ];

  const COLORS = ['#10B981', '#6366F1']; // Emerald and Indigo

  const handleExport = async () => {
    const tid = toast.loading(t('loading') || 'Generating PDF...');
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    const pageHeight = doc.internal.pageSize.height;
    const marginTop = 20; // Standard top margin for new pages
    const marginBottom = 20; // Standard bottom margin
    const chartWidth = 180;
    const chartHeight = 80;

    // Add Report Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(t('reportTitle'), 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t('generatedOn')}: ${new Date().toLocaleString()}`, 14, 30);

    // Add Summary Table
    autoTable(doc, {
      startY: marginTop + 20, // Start below initial header and some margin
      head: [[t('metrics'), t('value')]],
      body: [ 
        [t('totalIncome'), formatter.format(totalIncome)],
        [t('totalExpenses'), formatter.format(totalExpense)],
        [t('netWorth') || 'Net Worth', formatter.format(netSavings)],
      ],
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    });

    // Get the final Y position after the autoTable, or a fallback if it's the first element
    let currentY = doc.lastAutoTable.finalY || (marginTop + 20 + (3 * 10)); // Estimate height for 3 rows + padding

    // Helper function to check space and add a page if needed
    const checkAndAddPage = (requiredHeight) => {
      const remainingSpace = pageHeight - currentY - marginBottom;
      if (requiredHeight > remainingSpace) {
        doc.addPage();
        currentY = marginTop; // Reset cursor to top margin on new page
        // Optionally add a repeating header on new pages
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(t('reportContinued'), 14, currentY + 8);
        currentY += 20; // Space for the continued header
      }
    };

    currentY += 15; // Add a small margin after the summary table

    // Configuration for html2canvas to handle Tailwind v4's oklch colors
    const html2canvasOptions = {
      scale: 1.5, // Balanced for quality and mobile memory
      useCORS: true,
      logging: false,
      windowWidth: 1200, // Force a desktop-width layout for the render
      backgroundColor: profile?.theme === 'dark' ? '#1e293b' : '#ffffff',
      onclone: (clonedDoc) => {
        const container = clonedDoc.getElementById('pdf-chart-container');
        if (container) {
          // Force dimensions for the cloned environment
          container.style.width = '1000px';
          container.style.height = '500px';
          container.style.background = profile?.theme === 'dark' ? '#1e293b' : '#ffffff';
          
          const elements = container.querySelectorAll('*');
          elements.forEach(el => {
            // Scrub oklch from attributes and styles
            ['fill', 'stroke'].forEach(attr => {
              const val = el.getAttribute(attr);
              if (val && val.includes('oklch')) el.setAttribute(attr, '#6366f1');
            });
            if (el.style.fill?.includes('oklch')) el.style.fill = '#6366f1';
            if (el.style.stroke?.includes('oklch')) el.style.stroke = '#6366f1';
          });
        }
      }
    };

    try {
      if (barChartRef.current) {
        checkAndAddPage(chartHeight + 20); 

        const canvas = await html2canvas(barChartRef.current, html2canvasOptions);
        const imgData = canvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.text(t('incomeVsExpensesVisual'), 14, currentY);
        doc.addImage(imgData, 'PNG', 15, currentY + 10, chartWidth, chartHeight);
        currentY += chartHeight + 20;
      }

      doc.save('Financial_Report.pdf');
      toast.success(t('saved') || 'Report exported!', { id: tid });
    } catch (error) {
      console.error('PDF Export failed:', error);
      toast.error('Failed to generate PDF', { id: tid });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-indigo-400 mb-2 font-label">
            {t('financialAnalytics')}
          </p>
          <h2 className="text-5xl font-extrabold font-headline text-indigo-900 dark:text-white tracking-tighter">
            {t('performanceReports')}
          </h2>
        </div>
        <button onClick={handleExport} className="flex items-center px-6 py-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-headline font-bold rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white transition-all group">
          <FileDown size={18} className="mr-2 transition-transform group-hover:translate-y-0.5" />
          {t('exportPDF')}
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Chart: Income vs Expenses */}
        <div id="pdf-chart-container" ref={barChartRef} className="md:col-span-8 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm h-96"
          style={{ 
            backgroundColor: profile?.theme === 'dark' ? '#1e293b' : '#ffffff',
            borderColor: profile?.theme === 'dark' ? '#334155' : '#e2e8f0' 
          }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline text-indigo-900 dark:text-white mb-1">{t('incomeVsExpenses')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('yearToDateAnalysis')}</p>
            </div> 
            <div className="flex space-x-4">
              <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>{t('income')}
              </span>
              <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span>{t('expenses')}
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: profile?.theme === 'dark' ? '#1e293b' : '#fff', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right Column: Ratio & Quick Stats */}
        <div className="md:col-span-4 flex flex-col space-y-6">
          <div className="bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl p-8 flex-1 relative overflow-hidden shadow-lg shadow-indigo-200 dark:shadow-none">
            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"> 
              <Activity size={160} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-200 mb-8 font-label">{t('cashFlowRatio')}</h3>
            <div className="flex items-baseline space-x-2 mb-2">
              <span className="text-5xl font-extrabold font-headline">{ratio}</span>
              <span className="text-sm text-indigo-200 font-bold">x</span>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed mb-8 max-w-[180px]">
              {t('liquidityPositionMsg')}
            </p>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '72%' }}></div>
            </div>
            <div className="flex justify-between mt-3"> 
              <span className="text-[10px] font-bold text-indigo-200 uppercase">{t('riskThreshold')}</span>
              <span className="text-[10px] font-bold text-white uppercase">{t('optimum')}</span>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('quickStats')}</h4>
              <Zap size={16} className="text-indigo-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('monthlySavings')}</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatter.format(netSavings)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('dailyAvgBurn')}</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatter.format(totalExpense / 30)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trio: Detailed Analytics */}
        <div className="md:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-xl mb-6">
            <TrendingUp size={24} /> 
          </div>
          <h3 className="font-headline font-bold text-lg text-indigo-900 dark:text-white mb-2">{t('growthVector')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{t('growthVectorMsg')}</p>
          <div className="text-2xl font-extrabold font-headline text-emerald-600 dark:text-emerald-400">+{savingsRate}%</div>
        </div>

        <div className="md:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center rounded-xl mb-6">
            <Wallet size={24} /> 
          </div>
          <h3 className="font-headline font-bold text-lg text-indigo-900 dark:text-white mb-2">{t('liquidityScore')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{t('liquidityScoreMsg')}</p>
          <div className="text-2xl font-extrabold font-headline text-indigo-600 dark:text-indigo-400">{liquidityScore} / 100</div>
        </div>

        <div className="md:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1.5 bg-rose-500"></div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center rounded-xl mb-6">
            <AlertTriangle size={24} />
          </div>
          <h3 className="font-headline font-bold text-lg text-indigo-900 dark:text-white mb-2">{t('liabilityAlert')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{t('liabilityAlertMsg')}</p>
          <div className="text-2xl font-extrabold font-headline text-rose-600 dark:text-rose-400">{flaggedLiabilities} {t('actions')}</div>
        </div>

        {/* Full Ledger Table */}
        <div className="md:col-span-12 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-headline text-indigo-900 dark:text-white">{t('recentLedgerActivity')}</h3>
            <Link to="/transactions" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider">
              {t('viewAllHistory')}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] font-bold">
                  <th className="pb-6">{t('date') || 'Date'}</th>
                  <th className="pb-6">{t('category')}</th>
                  <th className="pb-6 text-right">{t('amount')}</th>
                  <th className="pb-6 text-right">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="text-sm border-t border-slate-100 dark:border-slate-700">
                {recentActivity.map((act, i) => (
                  <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-5 font-medium text-slate-500 dark:text-slate-400">
                      {formatDate(act.date)}
                    </td>
                    <td className="py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        act.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                      }`}>
                        {act.category || 'General'}
                      </span>
                    </td>
                    <td className={`py-5 text-right font-extrabold ${act.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {act.type === 'income' ? '+' : '-'}{formatter.format(act.amount)}
                    </td>
                    <td className="py-5 text-right">
                      {act.type === 'income' ? (
                        <CheckCircle2 size={18} className="inline text-emerald-500" />
                      ) : (
                        <Clock size={18} className="inline text-slate-300 dark:text-slate-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-20 py-10 flex justify-between items-center border-t border-slate-200 dark:border-slate-800 opacity-40">
        <div className="flex items-center space-x-2"> 
          <span className="text-xl font-bold font-headline text-indigo-900 dark:text-indigo-400">PST</span>
          <span className="h-4 w-[1px] bg-indigo-900 dark:bg-indigo-400"></span>
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase dark:text-white">Personal Saving Tracker System</span>
        </div>
        <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          © 2026 All Rights Reserved
        </div>
      </footer>
    </div>
  );
}
