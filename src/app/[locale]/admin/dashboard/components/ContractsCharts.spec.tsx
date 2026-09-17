import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { TestProviders } from '@/app/test-utils';
import enMessages from '../../../../../../messages/en.json';
import { ContractsByLugarChart } from './ContractsByLugarChart';
import { ContractsByMonthChart } from './ContractsByMonthChart';

describe('dashboard chart titles', () => {
  it('shows translated volunteer-signup titles in Spanish', () => {
    render(
      <TestProviders>
        <ContractsByMonthChart data={[{ month: '2026-09', count: 12 }]} />
        <ContractsByLugarChart data={[{ lugar: 'Madrid', count: 5 }]} />
      </TestProviders>,
    );
    expect(screen.getByText('Altas voluntarios por mes')).toBeInTheDocument();
    expect(screen.getByText('Altas voluntarios por lugar')).toBeInTheDocument();
  });

  it('shows translated volunteer-signup titles in English', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ContractsByMonthChart data={[{ month: '2026-09', count: 12 }]} />
        <ContractsByLugarChart data={[{ lugar: 'Madrid', count: 5 }]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Volunteer signups by month')).toBeInTheDocument();
    expect(screen.getByText('Volunteer signups by location')).toBeInTheDocument();
  });
});
