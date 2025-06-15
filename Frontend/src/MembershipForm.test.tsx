import React, { useState, useEffect } from 'react';

interface PlanDetail {
  price: number;
  defaultPaymentMethod: 'credit card' | 'cash';
}

/**
 * DECISION: Centralize plan-specific business logic into a constant object.
 * This makes it easy to manage pricing and defaults without scattering them
 * throughout the component logic. It acts as a single source of truth for plan data.
 */
const PLAN_DETAILS: Record<string, PlanDetail> = {
  "Platinum Plan": { price: 150, defaultPaymentMethod: "credit card" },
  "Gold Plan": { price: 100, defaultPaymentMethod: "credit card" },
  "Silver Plan": { price: 50, defaultPaymentMethod: "credit card" },
};

interface MembershipFormProps {
  onMembershipCreated: () => void; // A callback function to notify the parent.
}

/**
 * @component MembershipForm
 * A controlled form for creating new memberships. It handles its own state,
 * validation feedback, and API submission.
 */
function MembershipForm({ onMembershipCreated }: MembershipFormProps) {
  // State for each form field.
  const [name, setName] = useState<string>('Platinum Plan');
  const [recurringPrice, setRecurringPrice] = useState<number>(PLAN_DETAILS['Platinum Plan'].price);
  const [paymentMethod, setPaymentMethod] = useState<'credit card' | 'cash'>(PLAN_DETAILS['Platinum Plan'].defaultPaymentMethod);
  const [billingInterval, setBillingInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [billingPeriods, setBillingPeriods] = useState<number | ''>(6);
  const [validFrom, setValidFrom] = useState<string>('');

  // State for handling and displaying feedback (success or error messages) to the user.
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // EFFECT: Set the default 'validFrom' date to today when the component mounts.
  // This provides a sensible default for the user.
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setValidFrom(`${yyyy}-${mm}-${dd}`);
  }, []);

  // EFFECT: Automatically update the price and payment method when the plan name changes.
  // This creates a reactive UI where selecting a plan instantly updates related fields.
  useEffect(() => {
    const selectedPlan = PLAN_DETAILS[name];
    if (selectedPlan) {
      setRecurringPrice(selectedPlan.price);
      setPaymentMethod(selectedPlan.defaultPaymentMethod);
    }
  }, [name]);

  /**
   * Handles the form submission process.
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default browser form submission.

    // Simple client-side validation to avoid unnecessary API calls.
    if (billingPeriods === '' || billingPeriods < 1) {
      alert('Please enter a valid number of billing periods.');
      return;
    }

    setMessage(''); // Clear any previous messages.

    // Construct the payload to match the backend API's expected format.
    const formData = {
      name,
      recurringPrice: Number(recurringPrice),
      paymentMethod,
      billingInterval,
      billingPeriods: Number(billingPeriods),
      validFrom,
    };

    try {
      const response = await fetch('http://localhost:3000/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // The backend returns detailed error messages in a JSON body.
      const result = await response.json();

      if (response.ok) {
        // Success case (e.g., 201 Created).
        setMessage('Membership created successfully!');
        setMessageType('success');
        onMembershipCreated(); // Notify the parent component to refresh the list.
      } else {
        // Failure case (e.g., 400 Bad Request).
        // Display the specific error message returned from the backend.
        setMessage(`Error: ${result.message || 'Something went wrong!'}`);
        setMessageType('error');
      }
    } catch (error) {
      // Handle network errors (e.g., backend is down).
      setMessage(error instanceof Error ? `Network error: ${error.message}` : 'A network error occurred');
      setMessageType('error');
    }
  };

  return (
    <div className="membership-form-container">
      <h2>Create New Membership</h2>
      <form onSubmit={handleSubmit}>
        {/* Form fields... */}
        <div className="form-group">
          <label htmlFor="planName">Choose Plan:</label>
          <select id="planName" value={name} onChange={(e) => setName(e.target.value)}>
            {Object.keys(PLAN_DETAILS).map((plan) => (
              <option key={plan} value={plan}>{plan}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Recurring Price:</label>
          <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#28a293', padding: '8px 0' }}>
            ${recurringPrice}
          </span>
        </div>

        <div className="form-group">
          <label>Payment Method:</label>
          <div className="radio-group">
            <label>
              <input type="radio" value="credit card" checked={paymentMethod === 'credit card'} onChange={(e) => setPaymentMethod(e.target.value as 'credit card' | 'cash')} />
              Credit Card
            </label>
            <label>
              <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value as 'credit card' | 'cash')} />
              Cash
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="billingInterval">Billing Interval:</label>
          <select id="billingInterval" value={billingInterval} onChange={(e) => setBillingInterval(e.target.value as 'weekly' | 'monthly' | 'yearly')}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="billingPeriods">Number of Billing Periods:</label>
          <input type="number" id="billingPeriods" value={billingPeriods} onChange={(e) => {
            // Allow the input to be cleared.
            if (e.target.value === '') { setBillingPeriods(''); } 
            else { setBillingPeriods(Number(e.target.value)); }
          }} min="1" />
        </div>

        <div className="form-group">
          <label htmlFor="validFrom">Valid From:</label>
          <input type="date" id="validFrom" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
        </div>
        
        <button type="submit" className="primary-action-button">Create Membership</button>
      </form>

      {/* Conditional rendering for user feedback messages. */}
      {message && (
        <p className={messageType === 'success' ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}
    </div>
  );
}

export default MembershipForm;