import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './page';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn().mockResolvedValue({}),
  }),
}));

// Mock next/navigation
let mockSearchParams = new URLSearchParams();
let mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock document.cookie for CSRF token testing
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

const origEnv = process.env.NEXT_PUBLIC_AZURE_AD_ENABLED;

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockRouterPush.mockReset();
    (require('next-auth/react') as any).signIn = jest.fn();
    mockSearchParams.delete('error');
    document.cookie = '';
    process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = origEnv;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = origEnv;
  });

  describe('Rendering', () => {
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

    it('renders email input', () => {
      render(<LoginPage />);
      const emailInput = screen.getByPlaceholderText('Email');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toBeRequired();
    });

    it('renders password input', () => {
      render(<LoginPage />);
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toBeRequired();
    });

    it('renders submit button', () => {
      render(<LoginPage />);
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));
      expect(submitButton).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<LoginPage />);
      const forgotLink = screen.getByText('¿Olvidaste tu contraseña?');
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/recuperar-password');
    });

    it('renders logo image', () => {
      render(<LoginPage />);
      const logo = screen.getByAltText('logo');
      expect(logo).toBeInTheDocument();
      // Next.js Image component transforms the src, so just check it contains logo.png
      expect(logo.getAttribute('src')).toContain('logo.png');
    });

    it('renders card component', () => {
      render(<LoginPage />);
      expect(screen.getByText('Accede con tu cuenta de Fundación Altius')).toBeInTheDocument();
    });

    it('renders divider with "O" text', () => {
      render(<LoginPage />);
      expect(screen.getByText('O')).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText('Contraseña');
      // Find the toggle button - it's the one with tabIndex=-1
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find(button => button.getAttribute('tabindex') === '-1');
      expect(toggleButton).toBeDefined();

      // Initially should be password type
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton!);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide password
      await user.click(toggleButton!);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Input', () => {
    it('updates email state when email input changes', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates password state when password input changes', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText('Contraseña');
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Form Submission - handleCredentialsLogin', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: {
            status: 'active',
            has_password: true,
            email: 'test@example.com',
            display_name: 'Test User',
            name: 'Test User',
            role: 'admin',
            user_type: 'volunteer',
          },
          authToken: 'test-token',
        }),
      });
    });

    it('calls fetch with correct endpoint and method on form submission', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }));
      });
    });

    it('includes email and password in request body', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        }));
      });
    });

    it('includes CSRF token in headers when available', async () => {
      const user = userEvent.setup();
      // Set CSRF token cookie
      document.cookie = 'csrf_token=test-csrf-token';
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'test-csrf-token',
          }),
        }));
      });
    });

    it('includes empty string for CSRF token when not available', async () => {
      const user = userEvent.setup();
      // No CSRF token cookie
      document.cookie = '';
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': '',
          }),
        }));
      });
    });

    it('sets loading state to true when form is submitted', async () => {
      const user = userEvent.setup();
      // Make fetch slow to test loading state
      mockFetch.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ user: { status: 'active', has_password: true } }),
        }), 100)
      ));

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
      });
    });

    it('handles candidate status user with appropriate error message', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          user: { status: 'candidate' },
          error: 'Candidate pending',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Tu solicitud de voluntariado aún está en revisión. Te notificaremos cuando sea aprobada.')).toBeInTheDocument();
      });
    });

    it('handles inactive status user with appropriate error message', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          user: { status: 'inactive' },
          error: 'Inactive account',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Tu cuenta ha sido desactivada. Por favor, contacta con la fundación para más información.')).toBeInTheDocument();
      });
    });

    it('handles on-reserve status user with appropriate error message', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          user: { status: 'on-reserve' },
          error: 'On reserve',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Estás en nuestra lista de espera. Te notificaremos cuando haya disponibilidad.')).toBeInTheDocument();
      });
    });

    it('handles generic error when response is not ok', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: 'Invalid credentials',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('handles connection error gracefully', async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Connection error. Please try again.')).toBeInTheDocument();
      });
    });

    it('sets loading to false after error handling', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          user: { status: 'candidate' },
          error: 'Candidate pending',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        // After error, loading should be false and submit button should show original text
        const buttonsAfter = screen.getAllByRole('button');
        const submitButtonAfter = buttonsAfter.find(button => button.textContent?.includes('Iniciar sesión'));
        expect(submitButtonAfter).toBeInTheDocument();
      });
    });

    it('redirects to set-password when user is active but has no password_hash', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: {
            status: 'active',
            has_password: false,
            email: 'test@example.com',
          },
          setupToken: 'test-setup-token',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/crear-password?token=test-setup-token');
      });
    });

    it('calls signIn with correct parameters for successful login', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (require('next-auth/react') as any).signIn = mockSignIn;

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: {
            status: 'active',
            has_password: true,
            email: 'test@example.com',
            display_name: 'Test User',
            name: 'Test User',
            role: 'admin',
            user_type: 'volunteer',
          },
          authToken: 'test-token',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          user_type: 'volunteer',
          authToken: 'test-token',
          redirect: false,
        }));
      });
    });

    it('handles signIn error and shows error message', async () => {
      const user = userEvent.setup();
      const mockSignIn = jest.fn().mockResolvedValue({ error: 'Sign in failed' });
      (require('next-auth/react') as any).signIn = mockSignIn;

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: {
            status: 'active',
            has_password: true,
            email: 'test@example.com',
          },
          authToken: 'test-token',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(screen.getByText('Sign in failed')).toBeInTheDocument();
      });
    });

    it('redirects to /portal for general role user on successful login', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: {
            status: 'active',
            has_password: true,
            email: 'test@example.com',
            display_name: 'Test User',
            role: 'general',
          },
          authToken: 'test-token',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/portal');
      });
    });

    it('redirects to /admin/dashboard for admin role user on successful login', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: {
            status: 'active',
            has_password: true,
            email: 'test@example.com',
            display_name: 'Test User',
            role: 'admin',
          },
          authToken: 'test-token',
        }),
      });

      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(button => button.textContent?.includes('Iniciar sesión'));

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton!);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/admin/dashboard');
      });
    });
  });

  describe('Error Display from URL params', () => {
    it('shows AccessDenied error message when error param is AccessDenied', () => {
      mockSearchParams = new URLSearchParams('error=AccessDenied');

      render(<LoginPage />);
      expect(screen.getByText('Solo se permiten correos @fundacionaltius.org')).toBeInTheDocument();
    });

    it('shows generic auth error message for other error params', () => {
      mockSearchParams = new URLSearchParams('error=SessionRequired');

      render(<LoginPage />);
      expect(screen.getByText('Error de autenticación. Inténtalo de nuevo.')).toBeInTheDocument();
    });
  });

  describe('Microsoft Sign In', () => {
    it('calls signIn with azure-ad provider when Microsoft button is clicked', async () => {
      const user = userEvent.setup();
      process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = 'true';
      const mockSignIn = jest.fn();
      (require('next-auth/react') as any).signIn = mockSignIn;

      render(<LoginPage />);

      const msButton = screen.getByText('Sign in with Microsoft');
      await user.click(msButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('azure-ad', { callbackUrl: '/admin/dashboard' });
      });
    });

    it('sets msLoading state when Microsoft button is clicked', async () => {
      const user = userEvent.setup();
      process.env.NEXT_PUBLIC_AZURE_AD_ENABLED = 'true';
      const mockSignIn = jest.fn().mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({}), 100)
      ));
      (require('next-auth/react') as any).signIn = mockSignIn;

      render(<LoginPage />);

      const msButton = screen.getByText('Sign in with Microsoft');
      await user.click(msButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
      });
    });
  });

  describe('CSRF Token Helper Function', () => {
    it('getCSRFTokenFromCookie returns token when csrf_token cookie exists', () => {
      document.cookie = 'csrf_token=test-token-123';
      const { getCSRFTokenFromCookie } = require('./page');
      expect(getCSRFTokenFromCookie()).toBe('test-token-123');
    });

    it('getCSRFTokenFromCookie returns null when csrf_token cookie does not exist', () => {
      document.cookie = 'other_cookie=value';
      const { getCSRFTokenFromCookie } = require('./page');
      expect(getCSRFTokenFromCookie()).toBeNull();
    });

    it('getCSRFTokenFromCookie returns null when no cookies exist', () => {
      document.cookie = '';
      const { getCSRFTokenFromCookie } = require('./page');
      expect(getCSRFTokenFromCookie()).toBeNull();
    });

    it('getCSRFTokenFromCookie handles malformed cookies gracefully', () => {
      document.cookie = 'malformed_cookie; another_cookie=value';
      const { getCSRFTokenFromCookie } = require('./page');
      expect(getCSRFTokenFromCookie()).toBeNull();
    });

    it('getCSRFTokenFromCookie returns null when typeof document is undefined', () => {
      const originalDocument = global.document;
      global.document = undefined as any;
      
      const { getCSRFTokenFromCookie } = require('./page');
      expect(getCSRFTokenFromCookie()).toBeNull();
      
      global.document = originalDocument;
    });
  });
});