import { useState, forwardRef, useImperativeHandle } from 'react';
import type { MembershipItem } from './interfaces/MembershipInterface';

export interface MembershipListRef {
  refresh: () => void;
}

const MembershipList = forwardRef<MembershipListRef>((_, ref) => {
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListVisible, setIsListVisible] = useState(false);

  const fetchMemberships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/memberships');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch memberships.');
      }
      const data: MembershipItem[] = await response.json();
      setMemberships(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberships = async () => {
    if (!isListVisible) {
      await fetchMemberships();
    }
    setIsListVisible(!isListVisible);
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      if (isListVisible) {
        await fetchMemberships();
      }
    },
  }));

  return (
    <div className="membership-list-container">
      <h2>All Memberships</h2>
      <button onClick={toggleMemberships} disabled={loading} className="primary-action-button">
        {loading ? 'Loading...' : isListVisible ? 'Hide Memberships' : 'Show All Memberships'}
      </button>

      {error && <p className="error-message">Error: {error}</p>}
      {isListVisible && memberships.length === 0 && !loading && !error && (
        <p>No memberships found.</p>
      )}

      {isListVisible && memberships.length > 0 && (
        <div className="memberships-grid">
          {memberships.map((item, index) => (
            <div key={item.membership.id || index} className="membership-item-card">
              <h3>{item.membership.name}</h3>
              <p><strong>Price:</strong> ${item.membership.recurringPrice}</p>
              <p><strong>Valid From:</strong> {new Date(item.membership.validFrom).toLocaleDateString()}</p>
              <p><strong>Valid Until:</strong> {new Date(item.membership.validUntil).toLocaleDateString()}</p>
              <p><strong>Billing Interval:</strong> {item.membership.billingInterval}</p>
              <p><strong>Billing Periods:</strong> {item.membership.billingPeriods}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default MembershipList;
