'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';

interface FundaChartDataPoint {
  date: string;
  'Number of Shareholders'?: number;
  'Price'?: number;
}

interface FundaChartProps {
  ticker: string;
}

interface ApiResponse {
  shareholders: FundaChartDataPoint[];
  prices: FundaChartDataPoint[];
}

const TIMEFRAMES = [
  { label: '1Y', value: '1y' },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' });
};

const formatPrice = (price: number): string => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

export default function FundaChart({ ticker }: FundaChartProps) {
  const [timeframe, setTimeframe] = useState('1y');
  const [shareholders, setShareholders] = useState<FundaChartDataPoint[]>([]);
  const [prices, setPrices] = useState<FundaChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareholders, setShowShareholders] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  const fetchFundaData = useCallback(async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/stock/fundachart?ticker=${ticker}&timeframe=${timeframe}`);
      const json = await res.json();
      
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch funda chart data');
      }
      
      setShareholders(json.shareholders || []);
      setPrices(json.prices || []);
    } catch (err: any) {
      console.error('Funda chart error:', err);
      setError(err.message || 'Failed to load shareholder data');
    } finally {
      setLoading(false);
    }
  }, [ticker, timeframe]);

  useEffect(() => {
    fetchFundaData();
  }, [fetchFundaData]);

  // Merge shareholders and price data by date
  const mergedData = shareholders.map((sh) => {
    const pricePoint = prices.find(
      (p) => p.date === sh.date
    );
    return {
      date: sh.date,
      'Number of Shareholders': sh['Number of Shareholders'],
      'Price': pricePoint?.['Price'] || null,
    };
  });

  // Use only price data if no shareholders (for chart display)
  const chartData = mergedData.length > 0 ? mergedData : prices.map((p) => ({
    date: p.date,
    'Number of Shareholders': null,
    'Price': p['Price'],
  }));

  // Calculate statistics
  const shareholderStats = {
    current: shareholders[shareholders.length - 1]?.['Number of Shareholders'] || 0,
    min: shareholders.length > 0 ? Math.min(...shareholders.map((d) => d['Number of Shareholders'] || 0)) : 0,
    max: shareholders.length > 0 ? Math.max(...shareholders.map((d) => d['Number of Shareholders'] || 0)) : 0,
    change: shareholders.length > 1
      ? (((shareholders[shareholders.length - 1]?.['Number of Shareholders'] || 0) - (shareholders[0]?.['Number of Shareholders'] || 0)) / (shareholders[0]?.['Number of Shareholders'] || 1)) * 100
      : 0,
  };

  const priceStats = {
    current: prices[prices.length - 1]?.['Price'] || 0,
    min: prices.length > 0 ? Math.min(...prices.map((d) => d['Price'] || 0)) : 0,
    max: prices.length > 0 ? Math.max(...prices.map((d) => d['Price'] || 0)) : 0,
    change: prices.length > 1
      ? (((prices[prices.length - 1]?.['Price'] || 0) - (prices[0]?.['Price'] || 0)) / (prices[0]?.['Price'] || 1)) * 100
      : 0,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a2e] border border-[#16213e] rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Shareholders'
                ? formatNumber(entry.value)
                : entry.name === 'Price'
                ? formatPrice(entry.value)
                : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="funda-chart-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Funda Chart</h3>
          <span className="text-sm text-gray-400">{ticker}</span>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                timeframe === tf.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#16213e] text-gray-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[#16213e] rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Shareholders</p>
          <p className="text-lg font-semibold text-cyan-400">
            {formatNumber(shareholderStats.current)}
          </p>
          <p className={`text-xs ${shareholderStats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {shareholderStats.change >= 0 ? '+' : ''}{shareholderStats.change.toFixed(1)}%
          </p>
        </div>
        <div className="bg-[#16213e] rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Min Holders</p>
          <p className="text-lg font-semibold text-gray-300">
            {formatNumber(shareholderStats.min)}
          </p>
        </div>
        <div className="bg-[#16213e] rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Max Holders</p>
          <p className="text-lg font-semibold text-gray-300">
            {formatNumber(shareholderStats.max)}
          </p>
        </div>
        <div className="bg-[#16213e] rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Price</p>
          <p className="text-lg font-semibold text-amber-400">
            {priceStats.current > 0 ? formatPrice(priceStats.current) : 'N/A'}
          </p>
          <p className={`text-xs ${priceStats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceStats.change >= 0 ? '+' : ''}{priceStats.change.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart Legend Toggle */}
      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showShareholders}
            onChange={(e) => setShowShareholders(e.target.checked)}
            className="w-4 h-4 rounded bg-[#16213e] border-cyan-500 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-300">Shareholders</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPrice}
            onChange={(e) => setShowPrice(e.target.checked)}
            className="w-4 h-4 rounded bg-[#16213e] border-amber-500 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-gray-300">Price</span>
        </label>
      </div>

      {/* Loading/Error states */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
          <span className="ml-3 text-gray-400">Loading shareholder data...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-red-400 mt-3">{error}</p>
          <button
            onClick={fetchFundaData}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="shareholderGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#4b5563"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                tickLine={{ stroke: '#374151' }}
              />
              
              <YAxis
                yAxisId="shareholders"
                orientation="left"
                stroke="#06b6d4"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                tickFormatter={formatNumber}
              />
              
              {showPrice && (
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  stroke="#f59e0b"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#374151' }}
                  tickFormatter={(v) => `Rp ${v.toLocaleString('id-ID')}`}
                />
              )}
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
              />

              {showShareholders && (
                <>
                  <Area
                    yAxisId="shareholders"
                    type="monotone"
                    dataKey="Number of Shareholders"
                    name="Shareholders"
                    fill="url(#shareholderGradient)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="shareholders"
                    dataKey="Number of Shareholders"
                    name="Shareholders"
                    fill="#06b6d4"
                    opacity={0.3}
                  />
                </>
              )}

              {showPrice && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="Price"
                  name="Price"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#f59e0b' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Number of Shareholders trend compared with price movement
      </p>
    </div>
  );
}
