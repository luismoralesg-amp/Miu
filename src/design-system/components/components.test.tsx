import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, IconButton } from "./button";
import { Switch } from "./choice";
import { TextField } from "./field";
import { MaskedValue, maskValue } from "./masked-value";
import { Tooltip } from "./overlay";
import { RouteTabs } from "./route-tabs";
import { ErrorState, LoadingRegion } from "./states";
import { ThemeToggle } from "./theme-toggle";

vi.mock("next/navigation", () => ({ usePathname: () => "/dev/sistema/componentes" }));

describe("Button", () => {
  it("keeps its accessible name while loading and blocks repeat presses", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar cambios
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Guardar cambios" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Cancelar</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("names icon-only buttons", () => {
    render(<IconButton label="Notificaciones" icon={<svg />} />);
    expect(screen.getByRole("button", { name: "Notificaciones" })).toBeInTheDocument();
  });
});

describe("TextField", () => {
  it("links its hint and inline error to the input", () => {
    render(
      <TextField label="Correo" description="Usa tu correo @ufm.edu" error="Correo no válido" />,
    );
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Usa tu correo @ufm.edu Correo no válido");
  });

  it("is not marked invalid without an error", () => {
    render(<TextField label="Correo" />);
    expect(screen.getByLabelText("Correo")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Switch", () => {
  it("toggles aria-checked and reports the new value", async () => {
    const onChange = vi.fn();
    render(<Switch label="Recibir notificaciones" onCheckedChange={onChange} />);
    const control = screen.getByRole("switch", { name: "Recibir notificaciones" });
    expect(control).toHaveAttribute("aria-checked", "false");
    await userEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("MaskedValue", () => {
  it("masks all but the last characters", () => {
    expect(maskValue("1234567890101")).toBe("•••••••••0101");
    expect(maskValue("12")).toBe("•••12");
    expect(maskValue("14/03/2006", 0)).toBe("••••••••••");
  });

  it("hides the value until asked, and respects a refused step-up", async () => {
    const refuse = vi.fn().mockResolvedValue(false);
    render(<MaskedValue label="CUI" value="1234 56789 0101" onRevealRequest={refuse} />);
    expect(screen.queryByText("1234 56789 0101")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mostrar CUI" }));
    expect(refuse).toHaveBeenCalled();
    expect(screen.queryByText("1234 56789 0101")).not.toBeInTheDocument();
  });

  it("re-masks itself after 30 seconds", async () => {
    vi.useFakeTimers();
    render(<MaskedValue label="CUI" value="1234 56789 0101" />);
    await act(async () => screen.getByRole("button", { name: "Mostrar CUI" }).click());
    expect(screen.getByText("1234 56789 0101")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.queryByText("1234 56789 0101")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("Tooltip", () => {
  it("describes its trigger and opens on focus, closing on Escape", async () => {
    render(
      <Tooltip content="Descargar el programa">
        <button type="button">Programa</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Programa" });
    expect(trigger).toHaveAccessibleDescription("Descargar el programa");

    await userEvent.tab();
    expect(trigger).toHaveFocus();
    expect(screen.getAllByText("Descargar el programa")).toHaveLength(2);

    await userEvent.keyboard("{Escape}");
    expect(screen.getAllByText("Descargar el programa")).toHaveLength(1);
  });
});

describe("RouteTabs", () => {
  it("marks only the current route", () => {
    render(
      <RouteTabs
        label="Secciones"
        tabs={[
          { href: "/dev/sistema", label: "Fundamentos" },
          { href: "/dev/sistema/componentes", label: "Componentes" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Componentes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Fundamentos" })).not.toHaveAttribute("aria-current");
  });
});

describe("ThemeToggle", () => {
  it("applies the theme instantly and remembers it in a cookie", async () => {
    render(<ThemeToggle initial="system" />);
    await userEvent.click(screen.getByRole("radio", { name: "Oscuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.cookie).toContain("miu-theme=dark");

    await userEvent.click(screen.getByRole("radio", { name: "Sistema" }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.cookie).toContain("miu-theme=system");
  });
});

describe("states", () => {
  it("announces loading once", () => {
    render(
      <LoadingRegion label="Cargando notas…">
        <div aria-hidden="true" />
      </LoadingRegion>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Cargando notas…");
  });

  it("offers a retry on errors", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
