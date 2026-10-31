import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";

const state = {
  page: "login",
  csrf: "test-csrf",
  user: null,
  demoMode: false,
  otp: { step: "request" },
  messages: [],
  next: "",
  username: "",
};
const response = (body, status = 200) =>
  Promise.resolve({
    ok: status < 400,
    status,
    headers: { get: () => "application/json" },
    json: async () => body,
  });
afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

test("form submission uses the JSON API with multipart values and CSRF, and renders validation feedback", async () => {
  const user = userEvent.setup(),
    fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        response({ page: "public/login", state, data: {} }),
      )
      .mockImplementationOnce(() =>
        response({
          page: "public/login",
          state: {
            ...state,
            messages: [{ level: "error", text: "Check your login details" }],
          },
          data: {},
        }),
      );
  vi.stubGlobal("fetch", fetch);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/login/");
  render(<App />);
  await user.type(
    await screen.findByLabelText(/Mobile number or email/),
    "example@example.test",
  );
  await user.type(screen.getByLabelText(/Password/), "test-password");
  await user.click(
    screen.getByRole("button", { name: "Log in to my account" }),
  );
  await screen.findByText("Check your login details");
  const [path, options] = fetch.mock.calls[1];
  expect(path).toBe("/api/ui/login/");
  expect(options.headers["X-CSRFToken"]).toBe("test-csrf");
  expect(options.body.get("username")).toBe("example@example.test");
  expect(options.body.get("password")).toBe("test-password");
});

test("client navigation follows backend redirects and browser back reloads the correct API route", async () => {
  const user = userEvent.setup(),
    fetch = vi
      .fn()
      .mockImplementation((path) =>
        response(
          path === "/api/ui/enquire/"
            ? {
                redirect: "/login/",
                messages: [{ level: "info", text: "Sign in to continue" }],
              }
            : { page: "public/login", state, data: {} },
        ),
      );
  vi.stubGlobal("fetch", fetch);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/login/");
  render(<App />);
  await user.click(await screen.findByRole("tab", { name: "New customer" }));
  await screen.findByText("Sign in to continue");
  expect(window.location.pathname).toBe("/login/");
  window.history.replaceState({}, "", "/otp/");
  fireEvent.popState(window);
  await waitFor(() =>
    expect(fetch).toHaveBeenLastCalledWith("/api/ui/otp/", expect.anything()),
  );
});

test("permission errors keep the current form and show an actionable error", async () => {
  const user = userEvent.setup(),
    fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        response({ page: "public/login", state, data: {} }),
      )
      .mockImplementationOnce(() =>
        response({ error: "This account is not permitted." }, 403),
      );
  vi.stubGlobal("fetch", fetch);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/login/");
  render(<App />);
  await user.type(
    await screen.findByLabelText(/Mobile number or email/),
    "example@example.test",
  );
  await user.type(screen.getByLabelText(/Password/), "test-password");
  await user.click(
    screen.getByRole("button", { name: "Log in to my account" }),
  );
  await screen.findByText("This account is not permitted.");
  expect(screen.getByLabelText(/Mobile number or email/)).toHaveValue(
    "example@example.test",
  );
});
