'use client';

import { useState, useEffect } from 'react';
import FundaChart from './FundaChart';

interface FundaChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  companyName?: string;
}

export default function FundaChartModal({
  isOpen,
  onClose,
  ticker,
  companyName,
}: FundaChartModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0f0f23] border border-[#16213e] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#16213e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Funda Chart - {ticker}</h2>
              {companyName && (
                <p className="text-sm text-gray-400">{companyName}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-[#16213e] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <FundaChart ticker={ticker} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#16213e] flex justify-between items-center text-sm text-gray-500">
          <span>Number of Shareholders & Price from Stockbit</span>
          <span>{ticker}</span>
        </div>
      </div>
    </div>
  );
}
