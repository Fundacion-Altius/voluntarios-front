import { render, screen } from "@testing-library/react";
import { NewsCard } from "./NewsCard";
import { TestProviders } from '@/app/test-utils';

const mockPosts = [
  { id: "1", title: "Noticia 1", excerpt: "Resumen 1", published_at: "2024-01-15", slug: "noticia-1" },
  { id: "2", title: "Noticia 2", excerpt: "Resumen 2", published_at: "2024-01-20", slug: "noticia-2" },
  { id: "3", title: "Noticia 3", published_at: "2024-01-25", slug: "noticia-3" },
];

describe("NewsCard", () => {
  it("renders news title", () => {
    render(
      <TestProviders>
        <NewsCard posts={mockPosts} />
      </TestProviders>
    );
    expect(screen.getByText("Últimas noticias")).toBeInTheDocument();
  });

  it("renders up to 3 posts", () => {
    render(
      <TestProviders>
        <NewsCard posts={mockPosts} />
      </TestProviders>
    );
    expect(screen.getByText("Noticia 1")).toBeInTheDocument();
    expect(screen.getByText("Noticia 2")).toBeInTheDocument();
    expect(screen.getByText("Noticia 3")).toBeInTheDocument();
  });

  it("renders post excerpt when present", () => {
    render(
      <TestProviders>
        <NewsCard posts={mockPosts} />
      </TestProviders>
    );
    expect(screen.getByText("Resumen 1")).toBeInTheDocument();
  });

  it("renders post date", () => {
    render(
      <TestProviders>
        <NewsCard posts={mockPosts} />
      </TestProviders>
    );
    expect(screen.getByText(/15 ene\.? 2024/)).toBeInTheDocument();
  });

  it("renders verMas link", () => {
    render(
      <TestProviders>
        <NewsCard posts={mockPosts} />
      </TestProviders>
    );
    const link = screen.getByRole("link", { name: /Ver más/i });
    expect(link).toHaveAttribute("href", "/es/portal/noticias");
  });
});
