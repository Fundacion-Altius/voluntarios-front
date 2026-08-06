import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';

// Mock next-intl/server since ContractTable is a server component
jest.mock('next-intl/server', () => {
  const esMessages = require('../../../messages/es.json');
  const flatten = (obj: Record<string, any>, prefix = ''): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        Object.assign(result, flatten(value, path));
      } else {
        result[path] = value;
      }
    }
    return result;
  };
  const flat = flatten(esMessages);
  return {
    getTranslations: jest.fn(async (namespace: string) => {
      return (key: string) => flat[`${namespace}.${key}`] || key;
    }),
  };
});

import { ContractTable } from './ContractTable';

const mockContracts = [
  { id: '1', nombre: 'John Doe', email: 'john@example.com', areas: ['Nave'], fecha: '2024-01-15' },
  { id: '2', nombre: 'Jane Doe', email: 'jane@example.com', areas: ['Formación'], fecha: '2024-02-20' },
];

describe('ContractTable', () => {
  it('renders contracts', async () => {
    await act(async () => {
      render(await ContractTable({ contracts: mockContracts }));
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows empty state when no contracts', async () => {
    await act(async () => {
      render(await ContractTable({ contracts: [] }));
    });
    expect(screen.getByText('No hay contratos disponibles.')).toBeInTheDocument();
  });

  it('displays area names', async () => {
    await act(async () => {
      render(await ContractTable({ contracts: mockContracts }));
    });
    expect(screen.getByText('Nave')).toBeInTheDocument();
    expect(screen.getByText('Formación')).toBeInTheDocument();
  });
});
