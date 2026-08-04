import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select Component", () => {
  describe("Select Root", () => {
    it("renders Select component", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("has data-slot attribute on trigger", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    });

    it("passes props to root element", () => {
      render(
        <Select value="option1" disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const select = screen.getByRole("combobox");
      expect(select).toBeDisabled();
    });
  });

  describe("SelectTrigger", () => {
    it("renders trigger with default size", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-slot", "select-trigger");
      expect(trigger).toHaveAttribute("data-size", "default");
    });

    it("renders trigger with sm size", () => {
      render(
        <Select value="option1">
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-size", "sm");
    });

    it("renders with custom className", () => {
      render(
        <Select value="option1">
          <SelectTrigger className="custom-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveClass("custom-trigger");
    });

    it("renders children", () => {
      render(
        <Select value="">
          <SelectTrigger>
            <SelectValue placeholder="Custom placeholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText("Custom placeholder")).toBeInTheDocument();
    });

    it("renders with custom id", () => {
      render(
        <Select value="option1">
          <SelectTrigger id="custom-trigger-id">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("id", "custom-trigger-id");
    });
  });

  describe("SelectValue", () => {
    it("renders value placeholder", () => {
      render(
        <Select value="">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("renders selected value", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const value = screen.getByText("Option 1");
      expect(value).toHaveAttribute("data-slot", "select-value");
    });
  });

  describe("SelectContent", () => {
    it("renders content with default position", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      // Content might not be visible without user interaction
      // This test verifies the component can be rendered
    });

    it("renders content with item-aligned position", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
    });

    it("renders content with popper position", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
    });
  });

  describe("SelectItem", () => {
    it("renders select item", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
    });

    it("renders with custom className", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      );
    });

    it("renders with disabled state", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" disabled>
              Disabled Option
            </SelectItem>
            <SelectItem value="option2">Enabled Option</SelectItem>
          </SelectContent>
        </Select>
      );
    });

    it("renders with text content", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option Text</SelectItem>
          </SelectContent>
        </Select>
      );
    });
  });

  describe("SelectGroup", () => {
    it("renders select group", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    });
  });

  describe("SelectLabel", () => {
    it("renders select label", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group Label</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );
    });
  });

  describe("SelectSeparator", () => {
    it("renders select separator", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );
    });
  });

  describe("SelectScrollUpButton", () => {
    it("renders scroll up button", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
    });
  });

  describe("SelectScrollDownButton", () => {
    it("renders scroll down button", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );
    });
  });

  describe("Exports", () => {
    it("exports Select component", () => {
      expect(Select).toBeDefined();
    });

    it("exports SelectTrigger component", () => {
      expect(SelectTrigger).toBeDefined();
    });

    it("exports SelectValue component", () => {
      expect(SelectValue).toBeDefined();
    });

    it("exports SelectContent component", () => {
      expect(SelectContent).toBeDefined();
    });

    it("exports SelectItem component", () => {
      expect(SelectItem).toBeDefined();
    });

    it("exports SelectGroup component", () => {
      expect(SelectGroup).toBeDefined();
    });

    it("exports SelectLabel component", () => {
      expect(SelectLabel).toBeDefined();
    });

    it("exports SelectSeparator component", () => {
      expect(SelectSeparator).toBeDefined();
    });

    it("exports SelectScrollUpButton component", () => {
      expect(SelectScrollUpButton).toBeDefined();
    });

    it("exports SelectScrollDownButton component", () => {
      expect(SelectScrollDownButton).toBeDefined();
    });
  });

  describe("Integration Tests", () => {
    it("renders complete select with multiple options", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="broccoli">Broccoli</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders select with scroll buttons", () => {
      render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
            <SelectItem value="option3">Option 3</SelectItem>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );
    });

    it("renders select with custom trigger and content", () => {
      render(
        <Select value="option1">
          <SelectTrigger className="custom-trigger" size="sm">
            <SelectValue placeholder="Custom select" />
          </SelectTrigger>
          <SelectContent position="popper" align="center">
            <SelectItem value="option1">Custom Option</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-size", "sm");
    });
  });
});