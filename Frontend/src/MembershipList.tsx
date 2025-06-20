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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // State to control the visibility of the list, allowing it to be toggled.
  const [isListVisible, setIsListVisible] = useState(false);
  // State to track which membership is being deleted/terminated (for loading state)
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);

  /**
   * Fetches the list of memberships from the backend API.
   * Manages loading and error states throughout the request lifecycle.
   */
  const fetchMemberships = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
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
   * Deletes a membership after user confirmation.
   * DECISION: Use window.confirm for simplicity as requested. Shows a loading state
   * on the specific item being deleted to prevent multiple clicks and provide feedback.
   * 
   * @param id - The ID of the membership to delete
   * @param name - The name of the membership (for the confirmation message)
   */
  const handleDelete = async (id: number, name: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://localhost:3000/memberships/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete membership.');
      }

      setSuccessMessage(`Membership "${name}" has been successfully deleted.`);
      // Successfully deleted - refresh the list
      await fetchMemberships();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete membership.');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Terminates a membership after user confirmation.
   * DECISION: Similar to delete, but calls the terminate endpoint. Shows specific
   * error messages based on the business rules (active/pending, not in last period).
   * 
   * @param id - The ID of the membership to terminate
   * @param name - The name of the membership (for the confirmation message)
   * @param state - The current state of the membership
   */
  const handleTerminate = async (id: number, name: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to terminate "${name}"? All remaining periods will be terminated.`);
    
    if (!confirmed) {
      return;
    }

    setTerminatingId(id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`http://localhost:3000/memberships/${id}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to terminate membership.');
      }

      const data = await response.json();
      setSuccessMessage(data.message || `Membership "${name}" has been successfully terminated.`);
      // Successfully terminated - refresh the list
      await fetchMemberships();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to terminate membership.');
    } finally {
      setTerminatingId(null);
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

  /**
   * Determines if the terminate button should be shown for a membership.
   * Only show for active or pending memberships that are not already terminated.
   */
  const canTerminate = (state: string) => {
    return state === 'active' || state === 'pending';
  };

  return (
    <div className="membership-list-container">
      <h2>All Memberships</h2>
      <button onClick={toggleMemberships} disabled={loading} className="primary-action-button">
        {loading ? 'Loading...' : isListVisible ? 'Hide Memberships' : 'Show All Memberships'}
      </button>

      {/* Conditional rendering for feedback messages */}
      {error && <p className="error-message">Error: {error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}
      
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
              <p><strong>Status:</strong> <span style={{ 
                color: item.membership.state === 'active' ? 'green' : 
                       item.membership.state === 'pending' ? 'orange' :
                       item.membership.state === 'terminated' ? 'red' : 'gray'
              }}>{item.membership.state}</span></p>
              
              {/* Action buttons container */}
              <div className="action-buttons">
                {/* Terminate button - only shown for active/pending memberships */}
                {canTerminate(item.membership.state) && (
                  <button
                    className="terminate-button"
                    onClick={() => handleTerminate(item.membership.id, item.membership.name)}
                    disabled={terminatingId === item.membership.id}
                    aria-label={`Terminate ${item.membership.name}`}
                  >
                    {terminatingId === item.membership.id ? 'Terminating...' : 'Terminate'}
                  </button>
                )}
                
                {/* Delete button - always available */}
                <button
                  className="delete-button"
                  onClick={() => handleDelete(item.membership.id, item.membership.name)}
                  disabled={deletingId === item.membership.id}
                  aria-label={`Delete ${item.membership.name}`}
                >
                  {deletingId === item.membership.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default MembershipList;