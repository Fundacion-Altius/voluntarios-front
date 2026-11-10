import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button Component", () => {
  describe("Rendering", () => {
    it("renders with default variant", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("renders with default size", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByText("Click me");
      expect(button).toHaveAttribute("data-variant", "default");
      expect(button).toHaveAttribute("data-size", "default");
    });

    it("renders with custom className", () => {
      render(<Button className="custom-class">Click me</Button>);
      const button = screen.getByText("Click me");
      expect(button).toHaveClass("custom-class");
    });

    it("renders as button element by default", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByText("Click me");
      expect(button).toHaveAttribute("data-slot", "button");
    });
  });

  describe("Variant Props", () => {
    it("renders with default variant", () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByText("Default");
      expect(button).toHaveAttribute("data-variant", "default");
    });

    it("renders with destructive variant", () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByText("Destructive");
      expect(button).toHaveAttribute("data-variant", "destructive");
    });

    it("renders with outline variant", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByText("Outline");
      expect(button).toHaveAttribute("data-variant", "outline");
    });

    it("renders with secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByText("Secondary");
      expect(button).toHaveAttribute("data-variant", "secondary");
    });

    it("renders with ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByText("Ghost");
      expect(button).toHaveAttribute("data-variant", "ghost");
    });

    it("renders with link variant", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByText("Link");
      expect(button).toHaveAttribute("data-variant", "link");
    });
  });

  describe("Size Props", () => {
    it("renders with default size", () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByText("Default Size");
      expect(button).toHaveAttribute("data-size", "default");
    });

    it("renders with xs size", () => {
      render(<Button size="xs">XS Size</Button>);
      const button = screen.getByText("XS Size");
      expect(button).toHaveAttribute("data-size", "xs");
    });

    it("renders with sm size", () => {
      render(<Button size="sm">SM Size</Button>);
      const button = screen.getByText("SM Size");
      expect(button).toHaveAttribute("data-size", "sm");
    });

    it("renders with lg size", () => {
      render(<Button size="lg">LG Size</Button>);
      const button = screen.getByText("LG Size");
      expect(button).toHaveAttribute("data-size", "lg");
    });

    it("renders with icon size", () => {
      render(<Button size="icon">Icon Size</Button>);
      const button = screen.getByText("Icon Size");
      expect(button).toHaveAttribute("data-size", "icon");
    });

    it("renders with icon-xs size", () => {
      render(<Button size="icon-xs">Icon XS Size</Button>);
      const button = screen.getByText("Icon XS Size");
      expect(button).toHaveAttribute("data-size", "icon-xs");
    });

    it("renders with icon-sm size", () => {
      render(<Button size="icon-sm">Icon SM Size</Button>);
      const button = screen.getByText("Icon SM Size");
      expect(button).toHaveAttribute("data-size", "icon-sm");
    });

    it("renders with icon-lg size", () => {
      render(<Button size="icon-lg">Icon LG Size</Button>);
      const button = screen.getByText("Icon LG Size");
      expect(button).toHaveAttribute("data-size", "icon-lg");
    });
  });

  describe("Button Props", () => {
    it("renders with type button", () => {
      render(<Button type="button">Button Type</Button>);
      const button = screen.getByText("Button Type");
      expect(button).toHaveAttribute("type", "button");
    });

    it("renders with type submit", () => {
      render(<Button type="submit">Submit Type</Button>);
      const button = screen.getByText("Submit Type");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("renders with type reset", () => {
      render(<Button type="reset">Reset Type</Button>);
      const button = screen.getByText("Reset Type");
      expect(button).toHaveAttribute("type", "reset");
    });

    it("renders with disabled state", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText("Disabled");
      expect(button).toBeDisabled();
    });

    it("renders with aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByLabelText("Close dialog");
      expect(button).toBeInTheDocument();
    });

    it("renders with aria-invalid", () => {
      render(<Button aria-invalid>Invalid</Button>);
      const button = screen.getByText("Invalid");
      expect(button).toHaveAttribute("aria-invalid", "true");
    });

    it("renders with custom id", () => {
      render(<Button id="custom-id">Custom ID</Button>);
      const button = screen.getByText("Custom ID");
      expect(button).toHaveAttribute("id", "custom-id");
    });
  });

  describe("asChild Prop", () => {
    it("renders as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="#">Link Button</a>
        </Button>
      );
      const link = screen.getByText("Link Button");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "#");
    });

    it("renders as button when asChild is false", () => {
      render(<Button asChild={false}>Regular Button</Button>);
      const button = screen.getByText("Regular Button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("preserves data attributes when asChild is true", () => {
      render(
        <Button asChild variant="outline" size="lg">
          <a href="#">Styled Link</a>
        </Button>
      );
      const link = screen.getByText("Styled Link");
      expect(link).toHaveAttribute("data-slot", "button");
      expect(link).toHaveAttribute("data-variant", "outline");
      expect(link).toHaveAttribute("data-size", "lg");
    });
  });

  describe("Event Handlers", () => {
    it("calls onClick when clicked", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Clickable</Button>);

      const button = screen.getByText("Clickable");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick with event", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Clickable</Button>);

      const button = screen.getByText("Clickable");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it("does not call onClick when disabled", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByText("Disabled");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("calls onFocus when focused", async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      render(<Button onFocus={handleFocus}>Focusable</Button>);

      const button = screen.getByText("Focusable");
      await user.tab(); // Tab to focus the button

      expect(handleFocus).toHaveBeenCalled();
    });

    it("calls onBlur when blurred", async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      render(<Button onBlur={handleBlur}>Blurable</Button>);

      const button = screen.getByText("Blurable");
      button.focus();
      button.blur();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe("Ref Forwarding", () => {
    it("forwards ref to button element", () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe("BUTTON");
    });

    it("forwards ref to child element when asChild is true", () => {
      const ref = React.createRef<HTMLAnchorElement>();
      render(
        <Button ref={ref as any} asChild>
          <a href="#">Ref Link</a>
        </Button>
      );

      expect(ref.current).toBeInTheDocument();
      expect(ref.current?.tagName).toBe("A");
    });
  });

  describe("Display Name", () => {
    it("has correct display name", () => {
      expect(Button.displayName).toBe("Button");
    });
  });

  describe("Combined Props", () => {
    it("renders with multiple props combined", () => {
      render(
        <Button
          variant="destructive"
          size="lg"
          type="submit"
          disabled
          className="custom-class"
          aria-label="Delete item"
        >
          Delete
        </Button>
      );

      const button = screen.getByLabelText("Delete item");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("data-variant", "destructive");
      expect(button).toHaveAttribute("data-size", "lg");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("custom-class");
    });

    it("renders with all variant and size combinations", () => {
      const variants = ["default", "destructive", "outline", "secondary", "ghost", "link"];
      const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"];

      variants.forEach(variant => {
        sizes.forEach(size => {
          render(
            <Button variant={variant as any} size={size as any}>
              {variant}-{size}
            </Button>
          );
          const button = screen.getByText(`${variant}-${size}`);
          expect(button).toHaveAttribute("data-variant", variant);
          expect(button).toHaveAttribute("data-size", size);
        });
      });
    });
  });

  describe("Accessibility", () => {
    it("has cursor-pointer class by default", () => {
      render(<Button>Pointer</Button>);
      const button = screen.getByText("Pointer");
      expect(button.className).toContain("cursor-pointer");
    });

    it("has pointer-events-none class when disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText("Disabled");
      expect(button.className).toContain("pointer-events-none");
    });

    it("has opacity-50 class when disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByText("Disabled");
      expect(button.className).toContain("opacity-50");
    });
  });
});