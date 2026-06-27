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

describe('LoginPage', () => {
  it('renders sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    render(<LoginPage />);
    const elements = screen.getAllByText('Iniciar sesión');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(elements[0]).toBeInTheDocument();
  });
});
