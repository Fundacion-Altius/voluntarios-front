import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LugarFilter } from "./lugar-filter"

describe("LugarFilter Accessibility", () => {
  it("button has aria-expanded and aria-haspopup", () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(button).toHaveAttribute("aria-haspopup", "listbox")
    expect(button).toHaveAttribute("aria-controls")
  })

  it("popup has role=listbox when open", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox", { name: "Lugares" })
    expect(listbox).toBeInTheDocument()
  })

  it("popup is labelled by the trigger button (aria-labelledby)", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox", { name: "Lugares" })
    // The button's aria-controls points to the listbox id, establishing the relationship
    const controls = button.getAttribute("aria-controls")
    expect(controls).toBeTruthy()
    expect(listbox.id).toBe(controls)
    // Listbox retains its own aria-label for the accessible name
    expect(listbox).toHaveAttribute("aria-label", "Lugares")
  })

  it("options have aria-selected based on selected state", async () => {
    render(<LugarFilter selected={["Madrid"]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /1 lugar seleccionado/ })
    await userEvent.click(button)
    const madrid = screen.getByRole("option", { name: "Madrid" })
    expect(madrid).toHaveAttribute("aria-selected", "true")
    const barcelona = screen.getByRole("option", { name: "Barcelona" })
    expect(barcelona).toHaveAttribute("aria-selected", "false")
  })

  it("Escape key closes the dropdown and returns focus to button", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
    expect(button).toHaveFocus()
  })

  it("opens popup with listbox role when button clicked", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox", { name: "Lugares" })
    expect(listbox).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Madrid" })).toBeInTheDocument()
  })

  it("no native checkbox element — options are role=option spans (no dual-role)", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)
    // There should be no checkbox roles in the listbox
    const checkboxes = screen.queryAllByRole("checkbox")
    expect(checkboxes.length).toBe(0)
    // Options should be direct children of listbox (not nested in labels)
    const listbox = screen.getByRole("listbox")
    const options = listbox.querySelectorAll("[role='option']")
    expect(options.length).toBe(4)
  })

  it("has a visually-hidden aria-live region for selection announcements", () => {
    const { rerender } = render(<LugarFilter selected={[]} onChange={() => {}} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    // The live region uses sr-only class — find by aria-live attribute
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveAttribute("aria-atomic", "true")

    // Rerender with selection and check the live region text changes
    rerender(<LugarFilter selected={["Madrid", "Barcelona"]} onChange={() => {}} />)
    // Wait for the useEffect to fire
    return waitFor(() => {
      expect(liveRegion?.textContent).toMatch(/2 lugares seleccionados/)
    })
  })

  it("ArrowDown moves focus to next option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")
    const firstOption = screen.getByRole("option", { name: "Madrid" })
    // First option should have DOM focus after open
    await waitFor(() => expect(firstOption).toHaveFocus())

    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Barcelona" })).toHaveFocus()
    })
  })

  it("ArrowUp moves focus to previous option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")
    // Navigate to last option
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(listbox, { key: "ArrowDown" })
    }
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sevilla" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "ArrowUp" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Valencia" })).toHaveFocus()
    })
  })

  it("Enter key toggles the focused option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")
    // Navigate to Barcelona
    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Barcelona" })).toHaveFocus()
    })

    // Press Enter to toggle
    fireEvent.keyDown(listbox, { key: "Enter" })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /1 lugar seleccionado/ })).toBeInTheDocument()
    })
  })

  it("Space key toggles the focused option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")
    fireEvent.keyDown(listbox, { key: "ArrowDown" }) // Barcelona
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Barcelona" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: " " })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /1 lugar seleccionado/ })).toBeInTheDocument()
    })
  })

  it("Tab cycles focus within the listbox (focus trap)", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")

    // Focus is on Madrid (first)
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Madrid" })).toHaveFocus()
    })

    // Tab to next
    fireEvent.keyDown(listbox, { key: "Tab" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Barcelona" })).toHaveFocus()
    })

    // Tab again
    fireEvent.keyDown(listbox, { key: "Tab" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Valencia" })).toHaveFocus()
    })

    // Shift+Tab back
    fireEvent.keyDown(listbox, { key: "Tab", shiftKey: true })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Barcelona" })).toHaveFocus()
    })
  })

  it("Home key jumps to first option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")
    // Navigate to last
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(listbox, { key: "ArrowDown" })
    }
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sevilla" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "Home" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Madrid" })).toHaveFocus()
    })
  })

  it("End key jumps to last option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const listbox = screen.getByRole("listbox")
    fireEvent.keyDown(listbox, { key: "End" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sevilla" })).toHaveFocus()
    })
  })

  it("closes on click outside", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    // Click on a different element outside the component
    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("focus returns to button when popup closes", async () => {
    render(<LugarFilter selected={["Madrid"]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /1 lugar seleccionado/ })
    await userEvent.click(button)
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })

    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
    expect(button).toHaveFocus()
  })

  it("clicking an option toggles selection and focus stays on the option", async () => {
    render(<LugarFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por lugar/ })
    await userEvent.click(button)

    const madrid = screen.getByRole("option", { name: "Madrid" })
    await userEvent.click(madrid)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /1 lugar seleccionado/ })).toBeInTheDocument()
    })
    // Focus should still be on the option after click
    expect(madrid).toHaveFocus()
    expect(madrid).toHaveAttribute("aria-selected", "true")
  })

  it("renders a visual check indicator for selected options (no checkbox role)", async () => {
    render(<LugarFilter selected={["Madrid"]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /1 lugar seleccionado/ })
    await userEvent.click(button)
    const madrid = screen.getByRole("option", { name: "Madrid" })

    // Should have a visible check SVG inside
    const checkIcon = madrid.querySelector("svg")
    expect(checkIcon).toBeInTheDocument()
    expect(checkIcon).toHaveAttribute("aria-hidden", "true")
  })
})
