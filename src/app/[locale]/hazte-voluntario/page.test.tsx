import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HazteVoluntarioPage from './page';
import { TestProviders } from '../../test-utils';

// The page uses useTranslations('hazteVoluntario') from next-intl,
// and TestProviders wraps with NextIntlClientProvider (locale="es", esMessages).
// es.json contains the 'hazteVoluntario' namespace so the real translations work
// in tests — no need to mock next-intl itself.

// Mock next/navigation (useRouter)
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock CSRF / apiPost
jest.mock('@/app/lib/csrf', () => ({
  getCSRFToken: () => '',
  apiPost: jest.fn(),
}));

// Mock apiUrl
jest.mock('@/lib/apiUrl', () => ({
  getApiBaseUrl: () => 'http://localhost:3000',
}));

describe('HazteVoluntarioPage — accessibility', () => {
  const interesesOpts = [
    'Acompañamiento', 'Apoyo escolar', 'Cocina', 'Jardinería', 'Mantenimiento',
    'Ofimática', 'Recogida de alimentos', 'Ropero', 'Transporte', 'Otros',
  ];

  it('renders each interes checkbox with a proper accessible name via htmlFor/id association', () => {
    render(<TestProviders><HazteVoluntarioPage /></TestProviders>);

    // Every checkbox should be discoverable by its label text as the accessible name.
    // With the id + Label htmlFor fix, the label text Become the accessible name.
    interesesOpts.forEach((opt) => {
      const checkbox = screen.getByRole('checkbox', { name: opt });
      expect(checkbox).toBeInTheDocument();
    });
  });

  it('does not render checkboxes whose accessible name is empty (label association was broken before fix)', () => {
    render(<TestProviders><HazteVoluntarioPage /></TestProviders>);

    // Ensure none of the interes checkboxes have an empty accessible name.
    // Before the fix, getByRole('checkbox', { name: '' }) would have matched because
    // the label text was not programmatically associated.
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).toHaveAccessibleName();
    });
  });

  it('toggles checkbox state when the label is clicked (label association works)', async () => {
    render(<TestProviders><HazteVoluntarioPage /></TestProviders>);

    const checkbox = screen.getByRole('checkbox', { name: 'Cocina' });
    expect(checkbox).not.toBeChecked();

    // Clicking the associated Label (htmlFor) should toggle the checkbox.
    // Use fireEvent to avoid userEvent focus issues with <label> elements.
    const label = screen.getByText('Cocina');
    fireEvent.click(label);

    expect(checkbox).toBeChecked();

    fireEvent.click(label);
    expect(checkbox).not.toBeChecked();
  });

  it('toggles checkbox state when the checkbox is activated (Space/Enter or click)', async () => {
    const user = userEvent.setup();
    render(<TestProviders><HazteVoluntarioPage /></TestProviders>);

    const checkbox = screen.getByRole('checkbox', { name: 'Jardinería' });
    expect(checkbox).not.toBeChecked();

    // user.click on a role="checkbox" element triggers the same event path as
    // Space/Enter keyboard activation — Radix Checkbox handles both via the button.
    await user.click(checkbox);

    expect(checkbox).toBeChecked();

    // Toggle back.
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
