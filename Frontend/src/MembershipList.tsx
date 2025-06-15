import { useState, forwardRef, useImperativeHandle } from 'react';
import type { MembershipItem } from './interfaces/MembershipInterface';

/**
 * Defines the shape of the object that will be exposed to the parent component via the ref.
 * This ensures type safety for the imperative API.
 */
export interface MembershipListRef {
  refresh: () => void;
}

/**
 * @component MembershipList
 * Displays a list of all memberships fetched from the API.
 * DECISION: Use `forwardRef` to receive a ref from the parent (`App`) component.
 * This, combined with `useImperativeHandle`, allows the parent to call the `refresh`
 * function directly, providing a clean way to trigger a data re-fetch from outside.
 */
const MembershipList = forwardRef<MembershipListRef>((_, ref) => {
  // State for the list of memberships, loading status, and any potential errors.
  const [memberships, setMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State to control the visibility of the list, allowing it to be toggled.
  const [isListVisible, setIsListVisible] = useState(false);

  /**
   * Fetches the list of memberships from the backend API.
   * Manages loading and error states throughout the request lifecycle.
   */
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
      setLoading(false); // Ensure loading is set to false in all cases.
    }
  };

  /**
   * Toggles the visibility of the membership list.
   * OPTIMIZATION: Data is only fetched if the list is not currently visible,
   * preventing redundant API calls if the user repeatedly clicks the toggle button.
   */
  const toggleMemberships = async () => {
    if (!isListVisible) {
      await fetchMemberships();
    }
    setIsListVisible(!isListVisible);
  };

  /**
   * DECISION: Use `useImperativeHandle` to expose a specific, stable API to the parent component.
   * This is safer than exposing the entire component instance. Here, we only expose
   * the `refresh` function.
   * This function will re-fetch data only if the list is already visible.
   */
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

      {/* Conditional rendering based on the component's state (error, loading, empty, or has data). */}
      {error && <p className="error-message">Error: {error}</p>}
      {isListVisible && memberships.length === 0 && !loading && !error && (
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>No memberships found.</p>
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