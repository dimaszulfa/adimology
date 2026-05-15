'use client';

import { useState, useEffect } from 'react';
import { fetchOrderbook } from '@/lib/stockbit';

interface BidOfferCardProps {
  ticker: string;
}

interface BidOfferItem {
  price: string;
  que_num: string;
  volume: string;
  change_percentage: string;
}

export default function BidOfferCard({ ticker }: BidOfferCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOrderbook(ticker);
        setData(result.data);
      } catch (err: any) {
        console.error('BidOffer error:', err);
        setError(err.message || 'Failed to load orderbook');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [ticker]);

  if (loading && !data) {
    return (
      <div className="glass-card" style={{ 
        padding: '1rem', 
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="spinner" />
        <span className="ml-3 text-gray-400">Loading orderbook...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="glass-card" style={{ 
        padding: '1rem', 
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { bid = [], offer = [], close, high, low, change, percentage_change, volume, value, foreign, domestic } = data;

  // Get top 10 levels
  const topBids = bid.slice(0, 10);
  const topOffers = offer.slice(0, 10);

  // Calculate max volume for scaling
  const maxBidVol = Math.max(...topBids.map((b: BidOfferItem) => parseInt(b.volume) || 0));
  const maxOfferVol = Math.max(...topOffers.map((o: BidOfferItem) => parseInt(o.volume) || 0));
  const maxVol = Math.max(maxBidVol, maxOfferVol);

  // Calculate total bid/offer lots
  const totalBidLots = topBids.reduce((sum: number, b: BidOfferItem) => sum + (parseInt(b.que_num) || 0), 0);
  const totalOfferLots = topOffers.reduce((sum: number, o: BidOfferItem) => sum + (parseInt(o.que_num) || 0), 0);

  const formatVolume = (vol: string) => {
    const num = parseInt(vol) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPrice = (price: string) => {
    return parseInt(price).toLocaleString('id-ID');
  };

  return (
    <div className="glass-card" style={{ 
      padding: '0', 
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
          <span style={{ 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            color: '#fff', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px' 
          }}>
            Bid Offer
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem' }}>
          <span style={{ color: '#22c55e' }}>Foreign: {foreign}%</span>
          <span style={{ color: '#3b82f6' }}>Domestic: {domestic}%</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '2px' }}>LAST</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{close}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '2px' }}>CHANGE</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: change >= 0 ? '#22c55e' : '#ef4444' }}>
            {change >= 0 ? '+' : ''}{change} ({percentage_change}%)
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '2px' }}>VOLUME</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{formatVolume(String(volume))}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '2px' }}>VALUE</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
            Rp {(value / 1000000000).toFixed(1)}B
          </div>
        </div>
      </div>

      {/* Bid-Offer Depth */}
      <div style={{ padding: '0.75rem 1rem' }}>
        {/* Header Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 60px 60px 1fr',
          gap: '0.25rem',
          marginBottom: '0.5rem',
          fontSize: '0.6rem',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'left' }}>BID</div>
          <div style={{ textAlign: 'center' }}>LOT</div>
          <div style={{ textAlign: 'center' }}>VOL</div>
          <div style={{ textAlign: 'right' }}>OFFER</div>
        </div>

        {/* Depth Rows */}
        {topBids.map((bidItem: BidOfferItem, idx: number) => {
          const offerItem = topOffers[idx];
          const bidVol = parseInt(bidItem.volume) || 0;
          const offerVol = offerItem ? parseInt(offerItem.volume) || 0 : 0;
          const bidWidth = maxVol > 0 ? (bidVol / maxVol) * 100 : 0;
          const offerWidth = maxVol > 0 ? (offerVol / maxVol) * 100 : 0;

          return (
            <div key={idx} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 60px 60px 1fr',
              gap: '0.25rem',
              marginBottom: '2px',
              alignItems: 'center'
            }}>
              {/* Bid */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  height: '18px', 
                  width: `${bidWidth}%`,
                  background: 'linear-gradient(to right, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))',
                  borderRadius: '2px',
                  marginRight: '4px'
                }} />
                <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 500 }}>
                  {formatPrice(bidItem.price)}
                </span>
              </div>
              
              {/* Bid Lots */}
              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#9ca3af' }}>
                {bidItem.que_num}
              </div>

              {/* Offer Vol */}
              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#9ca3af' }}>
                {formatVolume(bidItem.volume)}
              </div>

              {/* Offer */}
              {offerItem ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                    {formatPrice(offerItem.price)}
                  </span>
                  <div style={{ 
                    height: '18px', 
                    width: `${offerWidth}%`,
                    background: 'linear-gradient(to left, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1))',
                    borderRadius: '2px',
                    marginLeft: '4px'
                  }} />
                </div>
              ) : (
                <div />
              )}
            </div>
          );
        })}

        {/* Summary Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 60px 60px 1fr',
          gap: '0.25rem',
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.65rem',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'left' }}>
            Total: <span style={{ color: '#22c55e' }}>{totalBidLots}</span>
          </div>
          <div />
          <div />
          <div style={{ textAlign: 'right' }}>
            Total: <span style={{ color: '#ef4444' }}>{totalOfferLots}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
