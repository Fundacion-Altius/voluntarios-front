import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LoginPage from './page';

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

const origEnv = process.env.NEXT_PUBLIC_AZURE_AD_ENABLED;

describe('LoginPage', () => {
  afterAll(() => {
    process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = origEnv;
  });

  it('renders sign in button when Azure AD is enabled', () => {
    process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = 'true';
    render(<LoginPage />);
    expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
  });

  it('does not render MS button when Azure AD is disabled', () => {
    delete process.env.NEXT_PUBLIC_AZURE_AD_ENABLED;
    render(<LoginPage />);
    expect(screen.queryByText('Sign in with Microsoft')).not.toBeInTheDocument();
  });

  it('renders the heading', () => {
    process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = 'true';
    render(<LoginPage />);
    const elements = screen.getAllByText('Iniciar sesión');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(elements[0]).toBeInTheDocument();
  });
});