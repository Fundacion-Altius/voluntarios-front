import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NuevaLeccionPage from "./page";
import { TestProviders } from "@/app/test-utils";

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({
    id: '1',
    moduleId: '1',
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Test', email: 'test@test.com' }, authToken: 'token123' },
    status: 'authenticated',
  }),
}));

describe("NuevaLeccionPage", () => {
  it("renders without crashing", async () => {
    render(
      <TestProviders>
        <NuevaLeccionPage />
      </TestProviders>
    );
    await waitFor(() => {
      expect(document.querySelector('[data-slot="card"]')).toBeTruthy();
    });
  });

  it("renders back button after loading", async () => {
    render(
      <TestProviders>
        <NuevaLeccionPage />
      </TestProviders>
    );
    await waitFor(() => {
      const backButton = screen.getByRole("button", { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  it("renders form fields after loading", async () => {
    render(
      <TestProviders>
        <NuevaLeccionPage />
      </TestProviders>
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
