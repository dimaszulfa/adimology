'use client';

import { useState, useEffect } from 'react';
import { getBrokerInfo } from '@/lib/brokers';
import EmitenPriceChart from './EmitenPriceChart';
import FundaChart from './FundaChart';

interface AnalysisRecord {
  id: number;
  from_date: string;
  emiten: string;
  sector?: string;
  bandar?: string;
  barang_bandar?: number;
  rata_rata_bandar?: number;
  harga?: number;
  ara?: number;
  arb?: number;
  target_realistis?: number;
  target_max?: number;
  real_harga?: number;
  max_harga?: number;
  status: string;
  error_message?: string;
}

interface EmitenHistoryCardProps {
  emiten: string;
}

const HEADER_HEIGHT = 45;
const ROW_HEIGHT = 56;
const ROW_COUNT_OPTIONS = [3, 5, 10, 20];
const PROFILE_KEY = 'history_row_count';

export default function EmitenHistoryCard({ emiten }: EmitenHistoryCardProps) {
  const [data, setData] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowCount, setRowCount] = useState(5);

  // Load saved row count preference on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profile?key=${PROFILE_KEY}`);
        const json = await res.json();
        if (json.success && json.value) {
          const saved = parseInt(json.value, 10);
          if (ROW_COUNT_OPTIONS.includes(saved)) {
            setRowCount(saved);
          }
        }
      } catch {
        // Silently use default
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (emiten) {
      fetchHistory();
    }
  }, [emiten, rowCount]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        emiten: emiten.toUpperCase(),
        limit: String(rowCount),
        sortBy: 'from_date',
        sortOrder: 'desc',
      });

      const response = await fetch(`/api/watchlist-history?${params}`);
      const json = await response.json();

      if (json.success) {
        // Reverse to show ascending (oldest to newest) as requested
        const sortedData = (json.data || []).reverse();
        setData(sortedData);
      }
    } catch (error) {
      console.error('Error fetching emiten history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowCountChange = async (count: number) => {
    setRowCount(count);
    // Save preference to database
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: PROFILE_KEY, value: String(count) }),
      });
    } catch {
      // Silently fail — preference will still work in-session
    }
  };

  const formatNumber = (num?: number) => num?.toLocaleString() ?? '-';
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Match "23-Jan" format from screenshot
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '');
    return `${day}-${month}`;
  };

  const calculateGain = (price: number | undefined, target: number | undefined) => {
    if (!price || !target || price === 0) return null;
    const gain = ((target - price) / price) * 100;
    return `${gain >= 0 ? '+' : ''}${gain.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Memuat riwayat {emiten}...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="glass-card-static" style={{ marginBottom: '1rem' }}>
      <div className="broker-flow-header">
        <span className="broker-flow-title">📊 Riwayat Analisis {emiten} ({rowCount} Terakhir)</span>
        <div className="broker-flow-filters">
          {ROW_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => handleRowCountChange(count)}
              className={`broker-flow-filter-btn ${rowCount === count ? 'active' : ''}`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '0', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-card)'
      }}>
        {/* Table Section */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ background: 'var(--bg-secondary)', height: `${HEADER_HEIGHT}px`, borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ whiteSpace: 'nowrap', padding: '0 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Date ↓
                </th>
                <th style={{ whiteSpace: 'nowrap', padding: '0 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Emiten</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Harga</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target R1</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Target Max</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Max Harga</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Close Harga</th>
                <th style={{ padding: '0 1rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bandar</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vol Bandar</th>
                <th style={{ padding: '0 1rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Bandar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record, index) => (
                <tr
                  key={record.id}
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    borderBottom: index < data.length - 1 ? '1px solid var(--border-color)' : 'none',
                    background: index % 2 === 0 ? 'transparent' : 'var(--glass-inner-glow)',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{formatDate(record.from_date)}</td>
                  <td style={{ padding: '0 0.75rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.8rem' }}>{record.emiten}</div>
                    {record.sector && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                        {record.sector}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                    {formatNumber(record.harga)}
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: 'var(--accent-success)' }}>
                      {formatNumber(record.target_realistis)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      {calculateGain(record.harga, record.target_realistis)}
                    </div>
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem', color: 'var(--accent-warning)' }}>
                      {formatNumber(record.target_max)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                      {calculateGain(record.harga, record.target_max)}
                    </div>
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right' }}>
                    {record.max_harga ? (
                      <>
                        <div style={{ 
                          fontWeight: 700, 
                          fontVariantNumeric: 'tabular-nums', 
                          fontSize: '0.85rem',
                          color: record.target_max && record.max_harga >= record.target_max
                            ? 'var(--accent-warning)'
                            : (record.target_realistis && record.max_harga >= record.target_realistis
                              ? 'var(--accent-success)'
                              : (record.harga && record.max_harga > record.harga
                                ? '#F59E0B'
                                : 'var(--text-primary)'))
                        }}>
                          {formatNumber(record.max_harga)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {calculateGain(record.harga, record.max_harga)}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right' }}>
                    {record.real_harga ? (
                      <>
                        <div style={{ 
                          fontWeight: 700, 
                          fontVariantNumeric: 'tabular-nums', 
                          fontSize: '0.85rem',
                          color: record.target_max && record.real_harga >= record.target_max
                            ? 'var(--accent-warning)'
                            : (record.target_realistis && record.real_harga >= record.target_realistis
                              ? 'var(--accent-success)'
                              : (record.harga && record.real_harga > record.harga
                                ? '#F59E0B'
                                : 'var(--text-primary)'))
                        }}>
                          {formatNumber(record.real_harga)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                          {calculateGain(record.harga, record.real_harga)}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '0 0.75rem', color: 'var(--text-primary)', fontSize: '0.75rem' }}>
                    {record.bandar ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{record.bandar}</span>
                        {(() => {
                          const brokerInfo = getBrokerInfo(record.bandar);
                          const displayType = brokerInfo.type === 'Smartmoney' ? 'Smart Money' : brokerInfo.type;
                          return (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--text-secondary)', 
                              opacity: 0.9,
                              background: 'var(--border-color)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              whiteSpace: 'nowrap'
                            }}>
                              {displayType}
                            </span>
                          );
                        })()}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '0.8rem' }}>
                    {formatNumber(record.barang_bandar)}
                  </td>
                  <td style={{ padding: '0 0.75rem', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem' }}>
                      {formatNumber(record.rata_rata_bandar)}
                    </div>
                    {record.rata_rata_bandar && record.harga && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {calculateGain(record.rata_rata_bandar, record.harga)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart Section */}
        <div style={{ 
          width: '240px', 
          minWidth: '240px',
          borderLeft: '1px solid var(--border-color)',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            height: `${HEADER_HEIGHT}px`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)'
          }}>
            Performance
          </div>
          <EmitenPriceChart
            data={data}
            headerHeight={0} // Managed by parent component's layout
            rowHeight={ROW_HEIGHT}
          />
        </div>
      </div>

      {/* Funda Chart Section - Number of Shareholders */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
        <FundaChart ticker={emiten} />
      </div>
    </div>
  );
}
