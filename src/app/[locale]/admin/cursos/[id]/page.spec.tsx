import { render, screen, waitFor } from "@testing-library/react";
import EditarCursoPage from "./page";
import { TestProviders } from "@/app/test-utils";

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Test', email: 'test@test.com' }, authToken: 'token123' },
    status: 'authenticated',
  }),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      id: '1',
      title: 'Curso Test',
      description: 'Descripción test',
      level: 'beginner',
      category: 'General',
      image_url: 'https://example.com/image.jpg',
      status: 'active',
      lesson_count: 5,
      created_at: '2024-01-01',
      modules: [],
    }),
  })
) as jest.Mock;

describe("EditarCursoPage", () => {
  it("renders without crashing", async () => {
    render(
      <TestProviders>
        <EditarCursoPage />
      </TestProviders>
    );
    await waitFor(() => {
      expect(document.querySelector('[data-slot="card"]')).toBeTruthy();
    });
  });

  it("renders a back button", async () => {
    render(
      <TestProviders>
        <EditarCursoPage />
      </TestProviders>
    );
    await waitFor(() => {
      const backButton = screen.getByRole("button", { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  it("renders form section", async () => {
    render(
      <TestProviders>
        <EditarCursoPage />
      </TestProviders>
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
