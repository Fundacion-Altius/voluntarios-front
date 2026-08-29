import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProviders } from '../../../test-utils';
import HitlInboxPage from './page';

const allow = jest.fn().mockResolvedValue(undefined);
const deny = jest.fn().mockResolvedValue(undefined);
const edit = jest.fn().mockResolvedValue(undefined);

jest.mock('@/app/auth/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

jest.mock('./useHitlInbox', () => ({
  useHitlInbox: () => ({
    items: [
      {
        id: 'q-1',
        tenantId: 'T1',
        agentId: 'ops',
        triggeringUserId: 'user-1',
        actionType: 'send-email',
        payloadDiff: 'hola voluntario',
        scopes: 'send-email',
        plane: 'hot',
        confidence: 0.9,
        status: 'pending',
        createdAt: '2026-08-29T00:00:00.000Z',
      },
    ],
    kpi: { submittedOutputs: 1, outputsWithoutSignOff: 0, pending: 1 },
    isLoading: false,
    error: null,
    allow,
    deny,
    edit,
    refresh: jest.fn(),
  }),
}));

describe('HitlInboxPage', () => {
  beforeEach(() => {
    allow.mockClear();
    deny.mockClear();
    edit.mockClear();
  });

  it('shows pending action, diff, scopes, plane, KPI, and review buttons', async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <HitlInboxPage />
      </TestProviders>,
    );

    expect(screen.getByRole('heading', { name: 'Cola HITL' })).toBeInTheDocument();
    expect(screen.getAllByText('send-email').length).toBeGreaterThan(0);
    expect(screen.getByText('hola voluntario')).toBeInTheDocument();
    expect(screen.getByText('hot')).toBeInTheDocument();
    expect(screen.getByText('Salidas enviadas')).toBeInTheDocument();
    expect(screen.getByText('Sin firma humana')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Allow' }));
    expect(allow).toHaveBeenCalledWith('q-1');
    await user.click(screen.getByRole('button', { name: 'Deny' }));
    expect(deny).toHaveBeenCalledWith('q-1');
  });
});
