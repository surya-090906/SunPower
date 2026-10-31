import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ApiContext } from "../lib/PageContext";
import {
  ActionForm,
  CsrfField,
  Field,
  FieldGroup,
  Fragment,
  PhotoUploader,
  SelectField,
  SignaturePad,
  UploadTile,
  WizardButton,
  WizardStep,
} from "./NativeRuntime";

afterEach(() => vi.restoreAllMocks());

test("nested option groups keep distinct identities when the selection changes", async () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const user = userEvent.setup();
  render(
    <SelectField aria-label="Product">
      <option value="">Choose</option>
      {[1, 2, 3].map((id) => (
        <Fragment key={id}>
          <option value={id}>Product {id}</option>
        </Fragment>
      ))}
    </SelectField>,
  );
  await user.selectOptions(screen.getByLabelText("Product"), "2");
  expect(screen.getAllByRole("option")).toHaveLength(4);
  expect(screen.getByLabelText("Product")).toHaveValue("2");
  expect(errors).not.toHaveBeenCalled();
});

test("React fields preserve selected values, repeated checkboxes and the session CSRF value", async () => {
  const user = userEvent.setup();
  const { container } = render(
    <ApiContext.Provider value={{ state: { csrf: "test-csrf" } }}>
      <ActionForm>
        <CsrfField />
        <FieldGroup>
          <label>Capacity</label>
          <Field name="kw" value="3" />
        </FieldGroup>
        <SelectField name="roof" aria-label="Roof">
          <option value="rcc">RCC</option>
          <option value="tin" selected>
            Tin
          </option>
        </SelectField>
        <Field type="checkbox" name="present" value="9" checked />
        <Field type="checkbox" name="present" value="10" checked />
      </ActionForm>
    </ApiContext.Provider>,
  );
  await user.clear(screen.getByLabelText("Capacity"));
  await user.type(screen.getByLabelText("Capacity"), "5");
  await user.selectOptions(screen.getByLabelText("Roof"), "rcc");
  const body = new FormData(container.querySelector("form"));
  expect(body.get("kw")).toBe("5");
  expect(body.get("roof")).toBe("rcc");
  expect(body.getAll("present")).toEqual(["9", "10"]);
  expect(body.get("csrfmiddlewaretoken")).toBe("test-csrf");
});

test("installation wizard changes steps and reveals fields with validation errors", async () => {
  const user = userEvent.setup();
  render(
    <ActionForm data-wizard="" data-start="0">
      <WizardStep>
        <h2>Checklist</h2>
        <Field name="kw" aria-label="Installed capacity" required />
        <WizardButton data-next="">Continue</WizardButton>
      </WizardStep>
      <WizardStep>
        <h2>Sign-off</h2>
        <WizardButton data-prev="">Back</WizardButton>
      </WizardStep>
    </ActionForm>,
  );
  expect(screen.getByRole("heading", { name: "Checklist" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("heading", { name: "Sign-off" })).toBeVisible();
  fireEvent.invalid(screen.getByLabelText("Installed capacity"));
  expect(screen.getByRole("heading", { name: "Checklist" })).toBeVisible();
});

test("customer signature is captured as PNG and can be cleared", () => {
  const ctx = {
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
    "data:image/png;base64,test-signature",
  );
  const { container } = render(
    <form>
      <SignaturePad />
    </form>,
  );
  const canvas = screen.getByLabelText("Customer signature");
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
  expect(new FormData(container.querySelector("form")).get("signature")).toBe(
    "data:image/png;base64,test-signature",
  );
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(new FormData(container.querySelector("form")).get("signature")).toBe(
    "",
  );
});

test("photo input sends multipart data through the authenticated API and displays errors", async () => {
  const user = userEvent.setup(),
    action = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, url: "/media/site.jpg", kind: "roof" })
      .mockRejectedValueOnce(Error("Upload could not finish"));
  vi.stubGlobal(
    "Image",
    class {
      set src(value) {
        queueMicrotask(() => this.onerror());
      }
    },
  );
  const { container } = render(
    <ApiContext.Provider value={{ action }}>
      <PhotoUploader
        data-target="survey"
        data-id="2"
        data-url="/app/field/photo/"
      >
        <UploadTile data-kind="roof">
          Roof photo
          <Field type="file" aria-label="Roof photo" />
        </UploadTile>
      </PhotoUploader>
    </ApiContext.Provider>,
  );
  const input = screen.getByLabelText("Roof photo");
  await user.upload(
    input,
    new File(["image"], "roof.jpg", { type: "image/jpeg" }),
  );
  await screen.findByAltText("Uploaded site photo");
  const [path, body, options] = action.mock.calls[0];
  expect(path).toBe("/app/field/photo/");
  expect(options).toEqual({ raw: true });
  expect(body.get("target")).toBe("survey");
  expect(body.get("id")).toBe("2");
  expect(body.get("kind")).toBe("roof");
  expect(body.get("file")).toBeInstanceOf(File);
  await user.upload(
    input,
    new File(["image"], "roof-2.jpg", { type: "image/jpeg" }),
  );
  await screen.findByText("Upload could not finish");
  expect(container.querySelector("[aria-busy]")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  vi.unstubAllGlobals();
});
