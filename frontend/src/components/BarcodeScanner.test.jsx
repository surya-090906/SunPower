import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const decoder = vi.hoisted(() => ({ decode: vi.fn() }));
vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: class {
    decodeFromStream(...args) {
      return decoder.decode(...args);
    }
  },
}));
import BarcodeScanner from "./BarcodeScanner";

let stop, controls, callback;
beforeEach(() => {
  vi.stubGlobal("isSecureContext", true);
  stop = vi.fn();
  controls = { stop: vi.fn() };
  callback = null;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    },
  });
  decoder.decode.mockImplementation(async (stream, video, cb) => {
    callback = cb;
    return controls;
  });
});
afterEach(() => vi.unstubAllGlobals());

test("camera decodes one barcode, stops and returns it for review without duplicate scans", async () => {
  const detected = vi.fn();
  render(<BarcodeScanner onDetected={detected} />);
  fireEvent.click(screen.getByRole("button", { name: "Scan with camera" }));
  await waitFor(() => expect(callback).toBeTypeOf("function"));
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
    audio: false,
    video: { facingMode: { ideal: "environment" } },
  });
  act(() => {
    callback({ getText: () => " PANEL-001 " }, null, controls);
    callback({ getText: () => "PANEL-001" }, null, controls);
  });
  expect(detected).toHaveBeenCalledExactlyOnceWith("PANEL-001");
  expect(stop).toHaveBeenCalled();
  expect(controls.stop).toHaveBeenCalled();
  expect(
    screen.queryByLabelText("Live barcode camera"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Detected: PANEL-001");
});
test("camera permission errors give a usable explanation", async () => {
  navigator.mediaDevices.getUserMedia.mockRejectedValue(
    Object.assign(Error("denied"), { name: "NotAllowedError" }),
  );
  render(<BarcodeScanner onDetected={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Scan with camera" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Camera permission was denied",
  );
});
test("leaving the page while permission is pending closes the late camera stream", async () => {
  let resolve;
  navigator.mediaDevices.getUserMedia.mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const { unmount } = render(<BarcodeScanner onDetected={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Scan with camera" }));
  await waitFor(() => expect(resolve).toBeTypeOf("function"));
  unmount();
  await act(async () => resolve({ getTracks: () => [{ stop }] }));
  expect(stop).toHaveBeenCalled();
});
test("camera is released when the operator stops scanning", async () => {
  render(<BarcodeScanner onDetected={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Scan with camera" }));
  await waitFor(() => expect(callback).toBeTypeOf("function"));
  fireEvent.click(screen.getByRole("button", { name: "Stop camera" }));
  expect(stop).toHaveBeenCalled();
});
