import { useStore } from '../store';
import { Users, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { translations } from '../translations';

export default function Dashboard() {
  const donations = useStore(state => state.donations);
  const expenses = useStore(state => state.expenses);
  const globalPercentage = useStore(state => state.globalPercentage);
  const language = useStore(state => state.language);
  const settings = useStore(state => state.settings);
  const t = translations[language];
  const { currency } = settings;

  const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalCollectorShare = donations.reduce((sum, d) => sum + d.collectorShare, 0);
  const totalNetAmount = donations.reduce((sum, d) => sum + d.netAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = totalNetAmount - totalExpenses;

  // Group donations by date for chart
  const donationsByDate = donations.reduce((acc, d) => {
    acc[d.date] = (acc[d.date] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(donationsByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7); // Last 7 days

  const statCards = [
    { title: t.totalDonations, amount: totalDonations, icon: Users, color: 'bg-blue-500' },
    { title: t.collectorShare, amount: totalCollectorShare, icon: TrendingUp, color: 'bg-orange-500' },
    { title: t.netDonations, amount: totalNetAmount, icon: DollarSign, color: 'bg-green-500' },
    { title: t.totalExpenses, amount: totalExpenses, icon: TrendingDown, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex items-center gap-4">
              <div className={`${stat.color} p-3 md:p-4 rounded-lg text-white`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-gray-500 font-medium truncate">{stat.title}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  <span className="text-lg md:text-xl font-normal opacity-70">{currency}</span> {stat.amount.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Chart */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 lg:col-span-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">{t.recentDonations}</h3>
          <div className="h-64 md:h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, t.amount]}
                    labelFormatter={(label) => `${t.date}: ${label}`}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                {t.noData}
              </div>
            )}
          </div>
        </div>

        {/* Summary & Settings */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Activity className="w-4 h-4 md:w-5 md:h-5 mx-2 text-blue-500" />
              {t.currentBalance}
            </h3>
            <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 truncate">
              {currency} {currentBalance.toLocaleString()}
            </div>
            <p className="text-xs md:text-sm text-gray-500 italic">
              {t.netMinusExpenses}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">{t.currentPercentage}</h3>
            <div className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-xs md:text-sm text-gray-600">{t.collectorShare}:</span>
              <span className="text-xl md:text-2xl font-bold text-blue-600">{globalPercentage}%</span>
            </div>
            <p className="text-[10px] md:text-xs text-gray-400 mt-3 text-center uppercase font-medium tracking-wider">
              {t.adminCanChange}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
