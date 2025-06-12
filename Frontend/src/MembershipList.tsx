import React, { useState } from 'react';
// Remove `CSSProperties` import

interface MembershipDetail {
  id: number;
  uuid: string;
  name: string;
  userId: number;
  recurringPrice: number;
  validFrom: string;
  validUntil: string;
  state: string;
  assignedBy?: string;
  paymentMethod: string | null;
  billingInterval: string;
  billingPeriods: number;
}

interface MembershipPeriodDetail {
    id: number;
    uuid: string;
    membership: number;
    start: string;
    end: string;
    state: string;
}

interface MembershipItem {
  membership: MembershipDetail;
  periods: MembershipPeriodDetail[];
}


function MembershipList() {
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isListVisible, setIsListVisible] = useState<boolean>(false);

  const fetchMemberships = async () => {
    setLoading(true);
    setError(null);
    setMemberships([]);

    try {
      const response = await fetch('http://localhost:3000/memberships');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch memberships.');
      }
      const data: MembershipItem[] = await response.json();
      setMemberships(data);
      setIsListVisible(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching memberships.');
      }
      setIsListVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="membership-list-container">
      <h2>All Memberships</h2>
      <button onClick={fetchMemberships} disabled={loading}>
        {loading ? 'Loading...' : 'Show All Memberships'}
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
}

export default MembershipList;