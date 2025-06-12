import React, { useState, useEffect } from 'react';
// Remove `CSSProperties` import if no inline styles are left

interface PlanDetail {
  price: number;
  defaultPaymentMethod: 'credit card' | 'cash';
}

const PLAN_DETAILS: Record<string, PlanDetail> = {
  "Gold Plan": { price: 60, defaultPaymentMethod: "credit card" },
  "Platinum Plan": { price: 90, defaultPaymentMethod: "credit card" },
  "Silver Plan": { price: 40, defaultPaymentMethod: "cash" },
};

function MembershipForm() {
  const [name, setName] = useState<string>('Gold Plan');
  const [recurringPrice, setRecurringPrice] = useState<number>(PLAN_DETAILS['Gold Plan'].price);
  const [paymentMethod, setPaymentMethod] = useState<'credit card' | 'cash'>(PLAN_DETAILS['Gold Plan'].defaultPaymentMethod);
  const [billingInterval, setBillingInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [billingPeriods, setBillingPeriods] = useState<number>(6);
  const [validFrom, setValidFrom] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setValidFrom(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    const selectedPlan = PLAN_DETAILS[name];
    if (selectedPlan) {
      setRecurringPrice(selectedPlan.price);
      setPaymentMethod(selectedPlan.defaultPaymentMethod);
    }
  }, [name]);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    const formData = {
      name,
      recurringPrice: Number(recurringPrice),
      paymentMethod,
      billingInterval,
      billingPeriods: Number(billingPeriods),
      validFrom,
    };

    console.log('Sending data:', formData);

    try {
      const response = await fetch('http://localhost:3000/memberships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Membership created successfully!');
        setMessageType('success');
        console.log('Success:', result);
      } else {
        setMessage(`Error: ${result.message || 'Something went wrong!'}`);
        setMessageType('error');
        console.error('Error:', result);
      }
    } catch (error: any) {
      setMessage(`Network error: ${error.message}`);
      setMessageType('error');
      console.error('Fetch error:', error);
    }
  };

  return (
    <div className="membership-form-container"> {/* Apply CSS class */}
      <h2>Create New Membership</h2>
      <form onSubmit={handleSubmit}> {/* Remove inline style */}
        <div className="form-group">
          <label htmlFor="planName">Choose Plan:</label>
          <select
            id="planName"
            value={name}
            onChange={(e) => setName(e.target.value)}
          >
            {Object.keys(PLAN_DETAILS).map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Recurring Price:</label>
          <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#007bff', padding: '8px 0' }}>${recurringPrice}</span>
          {paymentMethod === 'credit card' && recurringPrice !== 59}
        </div>

        <div className="form-group">
          <label>Payment Method:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="credit card"
                checked={paymentMethod === 'credit card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'credit card' | 'cash')}
              />{' '}
              Credit Card
            </label>
            <label>
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value as 'credit card' | 'cash')}
              />{' '}
              Cash
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="billingInterval">Billing Interval:</label>
          <select
            id="billingInterval"
            value={billingInterval}
            onChange={(e) => setBillingInterval(e.target.value as 'weekly' | 'monthly' | 'yearly')}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="billingPeriods">Number of Billing Periods:</label>
          <input
            type="number"
            id="billingPeriods"
            value={billingPeriods}
            onChange={(e) => setBillingPeriods(Number(e.target.value))}
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="validFrom">Valid From:</label>
          <input
            type="date"
            id="validFrom"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
        </div>

        <button type="submit">Create Membership</button>
      </form>

      {message && (
        <p className={messageType === 'success' ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}
    </div>
  );
}

export default MembershipForm;