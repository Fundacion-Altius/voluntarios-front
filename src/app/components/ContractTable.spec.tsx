import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ContractTable } from './ContractTable';

const mockContracts = [
  { id: '1', nombre: 'John Doe', email: 'john@example.com', areas: ['Nave'], fecha: '2024-01-15' },
  { id: '2', nombre: 'Jane Doe', email: 'jane@example.com', areas: ['Formación'], fecha: '2024-02-20' },
];

describe('ContractTable', () => {
  it('renders contracts', () => {
    render(<ContractTable contracts={mockContracts} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows empty state when no contracts', () => {
    render(<ContractTable contracts={[]} />);
    expect(screen.getByText('No hay contratos disponibles.')).toBeInTheDocument();
  });

  it('displays area names', () => {
    render(<ContractTable contracts={mockContracts} />);
    expect(screen.getByText('Nave')).toBeInTheDocument();
    expect(screen.getByText('Formación')).toBeInTheDocument();
  });
});
