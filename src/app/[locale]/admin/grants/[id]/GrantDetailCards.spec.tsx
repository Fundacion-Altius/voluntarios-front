import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '../../../../test-utils';
import { GrantRequirementsCard } from './GrantRequirementsCard';
import { GrantStatusHistoryCard } from './GrantStatusHistoryCard';
import { GrantExpensesCard } from './GrantExpensesCard';
import { grantApi } from '@/lib/api/grantApi';

jest.mock('@/lib/api/grantApi', () => ({
  grantApi: {
    updateRequirement: jest.fn(),
    createRequirement: jest.fn(),
    createExpense: jest.fn(),
  },
}));

const api = grantApi as jest.Mocked<typeof grantApi>;

describe('GrantRequirementsCard', () => {
  it('shows percent complete and marks a requirement complete', async () => {
    api.updateRequirement.mockResolvedValue({ success: true } as never);
    const onChanged = jest.fn();
    render(
      <TestProviders>
        <GrantRequirementsCard
          grantId="g1"
          onChanged={onChanged}
          data={{
            requirements: [
              { id: 'r1', grant_id: 'g1', title: 'Memoria', required: true, completed: false, created_at: '', updated_at: '' },
              { id: 'r2', grant_id: 'g1', title: 'Presupuesto', required: true, completed: true, created_at: '', updated_at: '' },
            ],
            completion: { total: 2, completed: 1, required_total: 2, required_completed: 1, percent: 50, ready_to_submit: false },
          }}
        />
      </TestProviders>,
    );

    expect(screen.getByTestId('requirements-percent')).toHaveTextContent('50%');
    fireEvent.click(screen.getByRole('checkbox', { name: /Memoria/ }));
    await waitFor(() => expect(api.updateRequirement).toHaveBeenCalledWith('g1', 'r1', { completed: true }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});

describe('GrantStatusHistoryCard', () => {
  it('renders the transition timeline with note', () => {
    render(
      <TestProviders>
        <GrantStatusHistoryCard
          history={[
            { id: 'h1', grant_id: 'g1', from_status: 'submitted', to_status: 'awarded', note: 'Resolución favorable', changed_at: '2026-11-01T10:00:00Z' },
          ]}
        />
      </TestProviders>,
    );
    expect(screen.getByText('Enviada')).toBeInTheDocument();
    expect(screen.getByText('Concedida')).toBeInTheDocument();
    expect(screen.getByText('Resolución favorable')).toBeInTheDocument();
  });
});

describe('GrantExpensesCard', () => {
  const data = { expenses: [], total_spent: 0, remaining: 1000 };

  it('hides the add form when expenses cannot be added', () => {
    render(
      <TestProviders>
        <GrantExpensesCard grantId="g1" data={data} canAdd={false} onChanged={jest.fn()} />
      </TestProviders>,
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('submits a new expense', async () => {
    api.createExpense.mockResolvedValue({ success: true } as never);
    const onChanged = jest.fn();
    render(
      <TestProviders>
        <GrantExpensesCard grantId="g1" data={data} canAdd onChanged={onChanged} />
      </TestProviders>,
    );
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Material' } });
    fireEvent.change(screen.getByLabelText('Importe'), { target: { value: '120.5' } });
    fireEvent.submit(screen.getByRole('form'));
    await waitFor(() =>
      expect(api.createExpense).toHaveBeenCalledWith('g1', { description: 'Material', amount: 120.5 }),
    );
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
