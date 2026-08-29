import { render, screen } from '@testing-library/react';
import { TestProviders } from '../../../../test-utils';
import { AutomationWorkloadWidget } from './AutomationWorkloadWidget';

describe('AutomationWorkloadWidget', () => {
  it('shows automated tasks, time saved and manual pending count', () => {
    render(
      <TestProviders>
        <AutomationWorkloadWidget
          metrics={{
            tasksAutomated: 65,
            hoursSaved: 5.4,
            breakdown: { member_comms: 50, churn_alerts: 10, grant_reminders: 5 },
          }}
          manualCount={5}
        />
      </TestProviders>,
    );

    expect(screen.getByTestId('automation-workload-widget')).toHaveTextContent('65');
    expect(screen.getByTestId('automation-workload-widget')).toHaveTextContent('5.4');
    expect(screen.getByTestId('automation-workload-widget')).toHaveTextContent('50');
    expect(screen.getByText(/5 tareas manuales pendientes/i)).toBeInTheDocument();
  });
});
