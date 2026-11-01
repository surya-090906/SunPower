import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Warehouse from "./Warehouse";
const state = { csrf: "test-token", messages: [] };
const customer = { id: 9, name: "Anita Rao", phone: "9600000071" };
const bundle = {
  id: 4,
  code: "DN-0004",
  project: "SP-0001",
  status: "to_pick",
  statusLabel: "To pick",
  canScan: true,
  canDispatch: false,
  lines: [
    {
      id: 1,
      name: "Solar panel",
      sku: "PNL-540",
      tracked: true,
      required: "2",
      picked: "1",
      remaining: "1",
      complete: false,
      serials: [{ id: 7, number: "PANEL-001" }],
    },
  ],
};

test("warehouse queue opens bundles by customer", () => {
  render(
    <Warehouse
      state={state}
      data={{
        status: "open",
        q: "",
        customers: [{ ...customer, bundles: [{ ...bundle, materials: 1 }] }],
      }}
    />,
  );
  expect(
    screen.getByRole("link", { name: "Open customer bundle" }),
  ).toHaveAttribute("href", "/app/inventory/customers/9/");
});
test("scans submit for the displayed customer bundle and show linked serials", () => {
  const { container } = render(
    <Warehouse state={state} data={{ customer, bundles: [bundle] }} />,
  );
  expect(screen.getByRole("link", { name: "PANEL-001" })).toHaveAttribute(
    "href",
    "/app/inventory/serials/7/",
  );
  const input = screen.getByLabelText(/Scan serial number or material SKU/);
  fireEvent.change(input, { target: { value: "PANEL-002" } });
  const form = input.form,
    body = new FormData(form);
  expect(form).toHaveAttribute("action", "/app/inventory/dispatch/4/do/");
  expect(body.get("action")).toBe("scan_material");
  expect(body.get("return_customer")).toBe("9");
  expect(body.get("code")).toBe("PANEL-002");
  expect(container.querySelector("[name=vehicle]")).toBeNull();
});
