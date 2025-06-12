import { useState } from 'react';

const plans = {
  Gold: 50,
  Platinum: 80,
  Silver: 30,
};

const MembershipForm = () => {
  const [plan, setPlan] = useState('Gold');
  const [recurringPrice, setRecurringPrice] = useState(plans['Gold']);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cash'>('credit_card');
  const [billingInterval, setBillingInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [billingPeriods, setBillingPeriods] = useState(6);
  const [validFrom, setValidFrom] = useState('');

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setPlan(selected);
    setRecurringPrice(plans[selected as keyof typeof plans]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: `${plan} Plan`,
      recurringPrice,
      paymentMethod,
      billingInterval,
      billingPeriods,
      validFrom,
    };

    try {
      const res = await fetch('http://localhost:3000/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.message}`);
        return;
      }

      const result = await res.json();
      alert('Membership created successfully!');
      console.log(result);
    } catch (error) {
      alert('Something went wrong!');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Membership</h2>

      <div>
        <label>Plan</label>
        <select value={plan} onChange={handlePlanChange}>
          {Object.keys(plans).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Recurring Price (€)</label>
        <input
          type="number"
          value={recurringPrice}
          onChange={(e) => setRecurringPrice(Number(e.target.value))}
          min={0}
          required
        />
      </div>

      <div>
        <label>Payment Method</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
            />
            Credit Card
          </label>
          <label>
            <input
              type="radio"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={() => setPaymentMethod('cash')}
            />
            Cash
          </label>
        </div>
      </div>

      <div>
        <label>Billing Interval</label>
        <select
          value={billingInterval}
          onChange={(e) =>
            setBillingInterval(e.target.value as 'weekly' | 'monthly' | 'yearly')
          }
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div>
        <label>Billing Periods</label>
        <input
          type="number"
          value={billingPeriods}
          onChange={(e) => setBillingPeriods(Number(e.target.value))}
          min={1}
          required
        />
      </div>

      <div>
        <label>Valid From</label>
        <input
          type="date"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
          required
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
};

export default MembershipForm;
