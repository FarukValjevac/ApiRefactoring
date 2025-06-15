import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

function Wrapper() {
  const [billingPeriods, setBillingPeriods] = React.useState(0);

  return (
    <div>
      <label htmlFor="billingPeriods">Number of Billing Periods:</label>
      <input
        type="number"
        id="billingPeriods"
        value={billingPeriods}
        onChange={(e) => {
          if (e.target.value === '') {
            setBillingPeriods(0);
          } else {
            setBillingPeriods(Number(e.target.value));
          }
        }}
        min="1"
      />
      <div data-testid="current-value">{billingPeriods}</div>
    </div>
  );
}

describe('Billing Periods input', () => {
  test('treats empty input as 0', () => {
    render(<Wrapper />);

    const input = screen.getByLabelText(/Number of Billing Periods/i);
    const display = screen.getByTestId('current-value');

    // Initially zero
    expect(display.textContent).toBe('0');

    // User clears the input (empty string)
    fireEvent.change(input, { target: { value: '' } });
    expect(display.textContent).toBe('0');

    // User enters 5
    fireEvent.change(input, { target: { value: '5' } });
    expect(display.textContent).toBe('5');
  });
});