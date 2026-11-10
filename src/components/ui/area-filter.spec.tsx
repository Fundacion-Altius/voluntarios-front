import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AreaFilter } from "./area-filter"

describe("AreaFilter Accessibility", () => {
  it("button has aria-expanded and aria-haspopup", () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(button).toHaveAttribute("aria-haspopup", "listbox")
    expect(button).toHaveAttribute("aria-controls")
  })

  it("popup has role=listbox when open", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox", { name: "Áreas" })
    expect(listbox).toBeInTheDocument()
  })

  it("popup is labelled by the trigger button (aria-labelledby)", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox", { name: "Áreas" })
    // The button's aria-controls points to the listbox id, establishing the relationship
    const controls = button.getAttribute("aria-controls")
    expect(controls).toBeTruthy()
    expect(listbox.id).toBe(controls)
    // Listbox retains its own aria-label for the accessible name
    expect(listbox).toHaveAttribute("aria-label", "Áreas")
  })

  it("options have aria-selected based on selected state", async () => {
    render(<AreaFilter selected={["CEPI"]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /1 área seleccionada/ })
    await userEvent.click(button)
    const cepi = screen.getByRole("option", { name: "CEPI" })
    expect(cepi).toHaveAttribute("aria-selected", "true")
    const reparto = screen.getByRole("option", { name: "Reparto de Alimentos" })
    expect(reparto).toHaveAttribute("aria-selected", "false")
  })

  it("Escape key closes the dropdown and returns focus to button", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
    expect(button).toHaveFocus()
  })

  it("no native checkbox element — options are role=option spans (no dual-role)", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const checkboxes = screen.queryAllByRole("checkbox")
    expect(checkboxes.length).toBe(0)
    const listbox = screen.getByRole("listbox")
    const options = listbox.querySelectorAll("[role='option']")
    expect(options.length).toBe(7)
  })

  it("has a visually-hidden aria-live region for selection announcements", () => {
    const { rerender } = render(<AreaFilter selected={[]} onChange={() => {}} />)
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).toBeInTheDocument()
    expect(liveRegion).toHaveAttribute("aria-atomic", "true")

    rerender(<AreaFilter selected={["CEPI", "Nave"]} onChange={() => {}} />)
    return waitFor(() => {
      expect(liveRegion?.textContent).toMatch(/2 áreas seleccionadas/)
    })
  })

  it("ArrowDown moves focus to next option", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Reparto de Alimentos" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Acompañamiento en la búsqueda de empleo" })).toHaveFocus()
    })
  })

  it("ArrowUp moves focus to previous option", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")

    // Go to last option (7 items, index 6)
    for (let i = 0; i < 6; i++) {
      fireEvent.keyDown(listbox, { key: "ArrowDown" })
    }
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Otra" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "ArrowUp" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Nave" })).toHaveFocus()
    })
  })

  it("Enter key toggles the focused option", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")

    fireEvent.keyDown(listbox, { key: "ArrowDown" }) // Acompañamiento
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Acompañamiento en la búsqueda de empleo" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "Enter" })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /1 área seleccionada/ })).toBeInTheDocument()
    })
  })

  it("Space key toggles the focused option", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")

    fireEvent.keyDown(listbox, { key: "ArrowDown" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Acompañamiento en la búsqueda de empleo" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: " " })
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /1 área seleccionada/ })).toBeInTheDocument()
    })
  })

  it("Tab cycles focus within the listbox (focus trap)", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Reparto de Alimentos" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "Tab" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Acompañamiento en la búsqueda de empleo" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "Tab" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Coaching" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "Tab", shiftKey: true })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Acompañamiento en la búsqueda de empleo" })).toHaveFocus()
    })
  })

  it("Home key jumps to first option", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")

    for (let i = 0; i < 6; i++) {
      fireEvent.keyDown(listbox, { key: "ArrowDown" })
    }
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Otra" })).toHaveFocus()
    })

    fireEvent.keyDown(listbox, { key: "Home" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Reparto de Alimentos" })).toHaveFocus()
    })
  })

  it("End key jumps to last option", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    const listbox = screen.getByRole("listbox")

    fireEvent.keyDown(listbox, { key: "End" })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Otra" })).toHaveFocus()
    })
  })

  it("closes on click outside", async () => {
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("focus returns to button when popup closes", async () => {
    render(<AreaFilter selected={["CEPI"]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /1 área seleccionada/ })
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
    render(<AreaFilter selected={[]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /Filtrar por área/ })
    await userEvent.click(button)

    const cepi = screen.getByRole("option", { name: "CEPI" })
    await userEvent.click(cepi)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /1 área seleccionada/ })).toBeInTheDocument()
    })
    expect(cepi).toHaveFocus()
    expect(cepi).toHaveAttribute("aria-selected", "true")
  })

  it("renders a visual check indicator for selected options (no checkbox role)", async () => {
    render(<AreaFilter selected={["CEPI"]} onChange={() => {}} />)
    const button = screen.getByRole("button", { name: /1 área seleccionada/ })
    await userEvent.click(button)
    const cepi = screen.getByRole("option", { name: "CEPI" })

    const checkIcon = cepi.querySelector("svg")
    expect(checkIcon).toBeInTheDocument()
    expect(checkIcon).toHaveAttribute("aria-hidden", "true")
  })
})
