import { render, screen } from "@testing-library/react";
import PageHeader from "./PageHeader";
import { TestProviders } from '@/app/test-utils';

describe("PageHeader", () => {
  it("renders title", () => {
    render(
      <TestProviders>
        <PageHeader title="Test Title" />
      </TestProviders>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });
});
