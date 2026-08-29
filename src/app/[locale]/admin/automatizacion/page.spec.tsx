import { render, screen } from '@testing-library/react';
import AutomationSettingsPage from './page';
import { TestProviders } from '../../../test-utils';
import { useAuth } from '@/app/auth/useAuth';

jest.mock('@/app/auth/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/apiClient', () => ({
  apiClient: jest.fn(async () => ({
    success: true,
    data: [
      {
        id: 'member.lapsed',
        enabled: true,
        templateName: 'member-lapsed.html',
        subject: 'Te echamos de menos',
      },
    ],
  })),
  apiUrl: (path: string) => path,
}));

describe('AutomationSettingsPage', () => {
  it('renders workflow enable control', async () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(
      <TestProviders>
        <AutomationSettingsPage />
      </TestProviders>,
    );
    expect(await screen.findByRole('checkbox')).toBeChecked();
    expect(screen.getByDisplayValue('Te echamos de menos')).toBeInTheDocument();
  });
});
