import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ClientRatingForm from "./ClientRatingForm";
import { TestProviders } from "../../test-utils";

const mockQuestions = [
  { id: 1, text: "¿Cómo fue la experiencia?", surveyID: 1 },
  { id: 2, text: "¿Recomendarías el programa?", surveyID: 1 },
];

let mockPush = jest.fn();
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const createServiceWorkerMock = () => {
  const listeners: Record<string, ((event: unknown) => void)[]> = {};
  return {
    controller: { postMessage: jest.fn() },
    addEventListener: jest.fn((evt: string, fn: (event: unknown) => void) => {
      (listeners[evt] = listeners[evt] || []).push(fn);
    }),
    removeEventListener: jest.fn(),
    __emit(evt: string, data: unknown) {
      (listeners[evt] || []).forEach((fn) => fn(data));
    },
  };
};

const rateAllQuestions = async () => {
  const starButtons = screen.getAllByLabelText(/Rate \d+ out of 5/i);
  await userEvent.click(starButtons[0]);
  await userEvent.click(starButtons[5]);
};

describe("ClientRatingForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as unknown as typeof fetch;
    Object.defineProperty(window, "navigator", {
      value: { onLine: true, serviceWorker: null },
    });
  });

  it("renders loading state when no questions", () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={[]} error="" />
      </TestProviders>
    );
    expect(screen.getByText(/Cargando preguntas/i)).toBeInTheDocument();
  });

  it("renders questions and star ratings", () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    expect(screen.getByText("¿Cómo fue la experiencia?")).toBeInTheDocument();
    expect(screen.getByText("¿Recomendarías el programa?")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    expect(screen.getByRole("button", { name: /Enviar/i })).toBeInTheDocument();
  });

  it("disables submit when not all ratings are set", () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    const button = screen.getByRole("button", { name: /Enviar/i });
    expect(button).toBeDisabled();
  });

  it("renders additional answer input", () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    expect(screen.getByPlaceholderText(/Ingresa tu respuesta/i)).toBeInTheDocument();
  });

  it("renders error message when provided", () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={[]} error="Error de prueba" />
      </TestProviders>
    );
    expect(screen.getByText("Error de prueba")).toBeInTheDocument();
  });

  it("renders offline indicator when offline", async () => {
    Object.defineProperty(window, "navigator", {
      value: { onLine: false, serviceWorker: null },
    });
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    await waitFor(() => {
      expect(screen.getByText(/No tienes conexión/i)).toBeInTheDocument();
    });
  });

  it("allows typing in additional answer input", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    const input = screen.getByPlaceholderText(/Ingresa tu respuesta/i);
    await user.type(input, "Comentario de prueba");
    expect(input).toHaveValue("Comentario de prueba");
  });

  it("calls fetch with correct payload on submit", async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    const input = screen.getByPlaceholderText(/Ingresa tu respuesta/i);
    await userEvent.type(input, "Test");

    const starButtons = screen.getAllByLabelText(/Rate \d+ out of 5/i);
    await userEvent.click(starButtons[0]);
    await userEvent.click(starButtons[5]);

    const button = screen.getByRole("button", { name: /Enviar/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    const callArgs = (mockFetch as any).mock.calls[1];
    expect(callArgs[0]).toContain("/api/surveys/submit-answer");
    expect(callArgs[1].method).toBe("POST");
    const body = JSON.parse(callArgs[1].body);
    expect(body.surveyID).toBe(1);
    expect(body.ratings).toHaveProperty("1");
    expect(body.additionalAnswer).toBe("Test");
  });

  it("refreshes questions from the API when fetch succeeds", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([{ id: 9, text: "Pregunta nueva", surveyID: 1 }]),
      })
    ) as unknown as typeof fetch;

    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="Error previo" />
      </TestProviders>
    );

    expect(await screen.findByText("Pregunta nueva")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Error previo")).not.toBeInTheDocument();
    });
  });

  it("keeps loading state when fetching questions fails without server data", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("network down"))
    ) as unknown as typeof fetch;

    render(
      <TestProviders>
        <ClientRatingForm questions={[]} error="" />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cargando preguntas/i)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("queues submission via service worker when offline submit fails", async () => {
    const sw = createServiceWorkerMock();
    Object.defineProperty(window, "navigator", {
      value: { onLine: false, serviceWorker: sw },
    });
    const mockFetch = jest.fn(() =>
      Promise.reject(new TypeError("Failed to fetch"))
    );
    global.fetch = mockFetch as unknown as typeof fetch;

    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    await rateAllQuestions();
    await userEvent.click(screen.getByRole("button", { name: /Enviar/i }));

    await waitFor(() => {
      expect(sw.controller.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: "survey-enqueue" })
      );
    });
    expect(
      await screen.findAllByText(/Tu respuesta ha sido guardada/i)
    ).toHaveLength(2);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows submit error when submission fails while online", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("boom"))
    ) as unknown as typeof fetch;

    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    await rateAllQuestions();
    await userEvent.click(screen.getByRole("button", { name: /Enviar/i }));

    expect(
      await screen.findByText(/Error al enviar la encuesta/i)
    ).toBeInTheDocument();
  });

  it("clears queued banner when service worker reports empty queue", async () => {
    const sw = createServiceWorkerMock();
    Object.defineProperty(window, "navigator", {
      value: { onLine: false, serviceWorker: sw },
    });
    global.fetch = jest.fn(() =>
      Promise.reject(new TypeError("Failed to fetch"))
    ) as unknown as typeof fetch;

    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    await rateAllQuestions();
    await userEvent.click(screen.getByRole("button", { name: /Enviar/i }));
    expect(await screen.findAllByText(/guardada/i)).toHaveLength(2);

    act(() => {
      sw.__emit("message", { data: { type: "survey-queue-update", queued: 0 } });
    });

    await waitFor(() => {
      expect(screen.queryAllByText(/guardada/i)).toHaveLength(1);
    });
  });

  it("toggles offline indicator on window online/offline events", async () => {
    render(
      <TestProviders>
        <ClientRatingForm questions={mockQuestions} error="" />
      </TestProviders>
    );
    expect(screen.queryByText(/No tienes conexión/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/No tienes conexión/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => {
      expect(screen.queryByText(/No tienes conexión/i)).not.toBeInTheDocument();
    });
  });
});
