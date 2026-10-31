import {
  Children,
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Alert, CircularProgress } from "@mui/material";
import { useApi } from "../lib/PageContext";
import { Messages } from "./Common";
export { Fragment };

export const text = (value) => (value == null ? "" : String(value));
export function cssStyle(source) {
  if (!source) return {};
  return Object.fromEntries(
    source
      .split(";")
      .filter(Boolean)
      .map((rule) => {
        const i = rule.indexOf(":");
        return [
          rule
            .slice(0, i)
            .trim()
            .replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
          rule.slice(i + 1).trim(),
        ];
      })
      .filter(([key]) => key),
  );
}
const modules = import.meta.glob("../pages/generated/**/*.jsx");
const components = new Map();
export function Partial({ part, state }) {
  if (!part) return null;
  const path = `../pages/generated/${part.page}.jsx`;
  if (!modules[path])
    return <Alert severity="error">This page is unavailable.</Alert>;
  if (!components.has(path)) components.set(path, lazy(modules[path]));
  const Page = components.get(path);
  return (
    <Suspense fallback={<CircularProgress size={22} />}>
      <Page data={part.data} state={state} />
    </Suspense>
  );
}

const DraftContext = createContext(null),
  LabelContext = createContext(null),
  WizardContext = createContext(null),
  UploadContext = createContext(null),
  FaultContext = createContext({});
const flattenText = (children) =>
  Children.toArray(children)
    .map((c) => (isValidElement(c) ? flattenText(c.props.children) : text(c)))
    .join("");
export function NativePage({ page, data, state }) {
  const [overrides, setOverrides] = useState({}),
    [stock, setStock] = useState({ tracked: undefined }),
    [added, setAdded] = useState(0),
    [geo, setGeo] = useState("");
  const patch = (values) => setOverrides((old) => ({ ...old, ...values }));
  return (
    <DraftContext.Provider
      value={{
        overrides,
        patch,
        stock,
        setStock,
        added,
        setAdded,
        geo,
        setGeo,
      }}
    >
      <main
        id="main-content"
        tabIndex={-1}
        className={`workflow-content ${page.startsWith("docs/") ? "print-page" : ""}`}
      >
        <Messages messages={state.messages} />
        <Partial part={{ page, data }} state={state} />
      </main>
    </DraftContext.Provider>
  );
}
export function CsrfField() {
  const api = useApi();
  return (
    <input
      type="hidden"
      name="csrfmiddlewaretoken"
      value={api?.state.csrf || ""}
    />
  );
}
export function FieldGroup({ children, ...props }) {
  const id = useId();
  return (
    <LabelContext.Provider value={id}>
      <div {...props}>
        {Children.map(children, (c) =>
          isValidElement(c) && c.type === "label"
            ? cloneElement(c, { htmlFor: c.props.htmlFor || id })
            : c,
        )}
      </div>
    </LabelContext.Provider>
  );
}
export function Field({
  value,
  defaultValue,
  checked,
  defaultChecked,
  children,
  ...props
}) {
  const draft = useContext(DraftContext),
    label = useContext(LabelContext),
    upload = useContext(UploadContext);
  const key = props.id || props.name;
  const [local, setLocal] = useState(value ?? defaultValue ?? "");
  const override = draft?.overrides[key];
  useEffect(() => {
    if (override !== undefined) setLocal(override);
  }, [override]);
  if (props.type === "file")
    return (
      <input {...props} onChange={upload ? upload.choose : props.onChange} />
    );
  if (props.type === "radio" || props.type === "checkbox")
    return (
      <input
        {...props}
        value={value ?? defaultValue}
        defaultChecked={
          override === undefined
            ? (checked ?? defaultChecked ?? false)
            : undefined
        }
        {...(override !== undefined
          ? {
              checked: !!override,
              onChange: (e) => draft.patch({ [key]: e.target.checked }),
            }
          : {})}
      />
    );
  const cost =
    props["data-cost"] !== undefined && draft?.stock.cost != null
      ? draft.stock.cost
      : undefined;
  return (
    <input
      {...props}
      id={props.id || (props.type !== "hidden" ? label : undefined)}
      aria-label={
        props["aria-label"] ||
        (!label && props.type !== "hidden"
          ? props.name?.replaceAll("_", " ")
          : undefined)
      }
      value={cost ?? local}
      onChange={(e) => {
        setLocal(e.target.value);
        if (cost !== undefined)
          draft.setStock((s) => ({ ...s, cost: e.target.value }));
        props.onChange?.(e);
      }}
    />
  );
}
export function TextArea({ value, defaultValue, children, ...props }) {
  const draft = useContext(DraftContext),
    label = useContext(LabelContext);
  const [local, setLocal] = useState(
    value ?? defaultValue ?? flattenText(children),
  );
  const override = draft?.overrides[props.id || props.name];
  useEffect(() => {
    if (override !== undefined) setLocal(override);
  }, [override]);
  return (
    <textarea
      {...props}
      id={props.id || label}
      aria-label={
        props["aria-label"] ||
        (!label ? props.name?.replaceAll("_", " ") : undefined)
      }
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        props.onChange?.(e);
      }}
    />
  );
}
function optionNodes(children) {
  return Children.toArray(children).flatMap((c) =>
    isValidElement(c) && c.type === Fragment
      ? optionNodes(c.props.children)
      : [c],
  );
}
export function SelectField({ children, value, defaultValue, ...props }) {
  const draft = useContext(DraftContext),
    label = useContext(LabelContext),
    ref = useRef(null);
  const options = optionNodes(children);
  const selected = options.find(
    (c) => isValidElement(c) && c.type === "option" && c.props.selected,
  );
  const [local, setLocal] = useState(
    value ?? defaultValue ?? selected?.props.value ?? "",
  );
  const override = draft?.overrides[props.id || props.name];
  useEffect(() => {
    if (override !== undefined) setLocal(override);
  }, [override]);
  useEffect(() => {
    if (props["data-product-select"] !== undefined && ref.current) {
      const option = ref.current.selectedOptions[0];
      draft?.setStock((s) => ({
        ...s,
        tracked: option?.dataset.tracked === "1",
      }));
    }
  }, []);
  return (
    <select
      {...props}
      id={props.id || label}
      ref={ref}
      value={local}
      aria-label={
        props["aria-label"] ||
        (!label ? props.name?.replaceAll("_", " ") : undefined)
      }
      onChange={(e) => {
        setLocal(e.target.value);
        if (props["data-product-select"] !== undefined) {
          const o = e.target.selectedOptions[0];
          draft?.setStock({
            tracked: o?.dataset.tracked === "1",
            cost: o?.dataset.cost || "",
          });
        }
        if (props["data-autosubmit"] !== undefined) {
          const form = e.target.form;
          queueMicrotask(() => form.requestSubmit());
        }
        props.onChange?.(e);
      }}
    >
      {options.map((c, i) => {
        if (!isValidElement(c) || c.type !== "option") return c;
        const { selected, ...p } = c.props;
        return cloneElement(c, { ...p, selected: undefined, key: i });
      })}
    </select>
  );
}
export function SerialFields({ children, ...props }) {
  const draft = useContext(DraftContext);
  return (
    <div {...props} hidden={draft?.stock.tracked === false}>
      {children}
    </div>
  );
}

export function ActionForm({ children, ...props }) {
  const [step, setStep] = useState(Number(props["data-start"]) || 0);
  const wizard = props["data-wizard"] !== undefined;
  let index = 0;
  const content = Children.map(children, (c) =>
    isValidElement(c) && c.type === WizardStep
      ? cloneElement(c, { index: index++ })
      : c,
  );
  return (
    <WizardContext.Provider
      value={wizard ? { step, setStep, count: index } : null}
    >
      <form
        {...props}
        onInvalidCapture={
          wizard
            ? (e) => {
                const s = e.target.closest("[data-wizard-step]");
                if (s) setStep(Number(s.dataset.wizardStep));
              }
            : undefined
        }
      >
        {content}
      </form>
    </WizardContext.Provider>
  );
}
export function WizardStep({ index, children, className = "", ...props }) {
  const wizard = useContext(WizardContext);
  return (
    <div
      {...props}
      data-wizard-step={index}
      className={`${className} ${wizard?.step === index ? "active" : ""}`}
      hidden={wizard?.step !== index}
    >
      {children}
    </div>
  );
}
export function WizardHead({ children, ...props }) {
  const wizard = useContext(WizardContext);
  let i = 0;
  return (
    <div {...props}>
      {Children.map(children, (c) =>
        isValidElement(c)
          ? cloneElement(c, { className: i++ === wizard?.step ? "active" : "" })
          : c,
      )}
    </div>
  );
}
export function WizardButton({ children, ...props }) {
  const w = useContext(WizardContext);
  return (
    <button
      {...props}
      type="button"
      onClick={() => {
        w?.setStep(
          Math.max(
            0,
            Math.min(
              w.count - 1,
              w.step + (props["data-next"] !== undefined ? 1 : -1),
            ),
          ),
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </button>
  );
}

export function SignaturePad({ children, ...props }) {
  const canvas = useRef(null),
    drawing = useRef(false),
    drew = useRef(false),
    [signature, setSignature] = useState("");
  const wizard = useContext(WizardContext);
  useEffect(() => {
    const c = canvas.current;
    const resize = () => {
      const width = c.clientWidth;
      if (!width) return;
      const old = drew.current ? c.toDataURL() : null;
      const ratio = window.devicePixelRatio || 1;
      c.width = width * ratio;
      c.height = 190 * ratio;
      const ctx = c.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#172b3a";
      if (old) {
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, width, 190);
        image.src = old;
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(c);
    resize();
    return () => observer.disconnect();
  }, [wizard?.step]);
  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const finish = () => {
    drawing.current = false;
    if (drew.current) setSignature(canvas.current.toDataURL("image/png"));
  };
  return (
    <div {...props}>
      <canvas
        ref={canvas}
        aria-label="Customer signature"
        style={{ width: "100%", height: 190, touchAction: "none" }}
        onPointerDown={(e) => {
          drawing.current = true;
          canvas.current.setPointerCapture?.(e.pointerId);
          const ctx = canvas.current.getContext("2d");
          ctx.beginPath();
          ctx.moveTo(...point(e));
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvas.current.getContext("2d");
          ctx.lineTo(...point(e));
          ctx.stroke();
          drew.current = true;
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
      <input type="hidden" name="signature" value={signature} />
      <div className="spread mt-s">
        <span className="hint">Sign inside the box</span>
        <button
          className="btn btn-line"
          type="button"
          onClick={() => {
            const c = canvas.current;
            c.getContext("2d").clearRect(0, 0, c.width, c.height);
            drew.current = false;
            setSignature("");
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
export function GeoButton({ children, ...props }) {
  const draft = useContext(DraftContext);
  return (
    <button
      {...props}
      type="button"
      onClick={() => {
        if (!navigator.geolocation) {
          draft?.setGeo("Location is unavailable. You can still submit.");
          return;
        }
        draft?.setGeo("Finding your location…");
        navigator.geolocation.getCurrentPosition(
          (p) => {
            draft?.patch({
              geo_lat: p.coords.latitude.toFixed(6),
              geo_lng: p.coords.longitude.toFixed(6),
            });
            draft?.setGeo("Location captured.");
          },
          () =>
            draft?.setGeo(
              "Location could not be captured. You can still submit.",
            ),
          { timeout: 10000, enableHighAccuracy: true },
        );
      }}
    >
      {children}
    </button>
  );
}
export function GeoStatus(props) {
  const draft = useContext(DraftContext);
  return (
    <span {...props} role="status">
      {draft?.geo}
    </span>
  );
}

async function compress(file) {
  if (!file.type?.startsWith("image/") || file.type === "image/svg+xml")
    return file;
  return new Promise((resolve) => {
    const image = new Image(),
      url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height)),
        canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas
        .getContext("2d")
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.8);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    image.src = url;
  });
}
export function PhotoUploader({ children, ...props }) {
  const api = useApi(),
    draft = useContext(DraftContext),
    [photos, setPhotos] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function upload(files, kind) {
    setError("");
    setBusy(true);
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", await compress(file), "photo.jpg");
        body.append("target", props["data-target"]);
        body.append("id", props["data-id"]);
        body.append("kind", kind);
        const result = await api.action(props["data-url"], body, { raw: true });
        if (!result.ok) throw Error(result.error || "Upload failed.");
        setPhotos((p) => [...p, result]);
        draft?.setAdded((n) => n + 1);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <UploadContext.Provider value={{ upload, busy }}>
      <div {...props} aria-busy={busy}>
        {children}
        {photos.map((p, i) => (
          <div className="thumb" key={i}>
            <img src={p.url} alt="Uploaded site photo" />
            <span className="k">{p.kind}</span>
          </div>
        ))}
        {busy && <span role="status">Uploading photo…</span>}
        {error && <Alert severity="error">{error}</Alert>}
      </div>
    </UploadContext.Provider>
  );
}
export function UploadTile({ children, ...props }) {
  const uploader = useContext(UploadContext);
  const choose = (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (files.length) uploader?.upload(files, props["data-kind"] || "photo");
  };
  return (
    <UploadContext.Provider value={{ ...uploader, choose }}>
      <label {...props} aria-disabled={uploader?.busy}>
        {children}
      </label>
    </UploadContext.Provider>
  );
}
export function PhotoCount({ children, ...props }) {
  const draft = useContext(DraftContext);
  return (
    <span {...props}>
      {(Number(flattenText(children)) || 0) + (draft?.added || 0)}
    </span>
  );
}

export function QuickAddExtractor() {
  const draft = useContext(DraftContext),
    [message, setMessage] = useState(""),
    [status, setStatus] = useState("");
  const extract = () => {
    const p = {};
    const phone = message.match(/(?:\+91[\s-]*)?([6-9][0-9\s-]{8,14}[0-9])/);
    if (phone) p["f-phone"] = phone[1].replace(/\D/g, "").slice(-10);
    const name = message.match(
      /(?:my name is|i am|i'm|name[:\s]+)\s*([a-z ]+?)(?:\s+from\b|[,.\n]|$)/i,
    );
    if (name) p["f-name"] = name[1].trim();
    const pin = message.match(/\b[1-9][0-9]{5}\b/);
    if (pin) p["f-pincode"] = pin[0];
    const capacity = message.match(/([1-5])\s*kw/i);
    if (capacity) p["f-kw"] = capacity[1];
    if (/off[ -]?grid/i.test(message)) p["f-package"] = "offgrid";
    else if (/on[ -]?grid/i.test(message)) p["f-package"] = "ongrid";
    const city = message.match(
      /\b(Bengaluru|Bangalore|Mysuru|Chennai|Hyderabad|Mumbai|Pune|Delhi|Coimbatore|Hubli|Mangalore)\b/i,
    );
    if (city) p["f-city"] = city[0];
    draft?.patch(p);
    setStatus(
      Object.keys(p).length
        ? "Details extracted. Review the form before submitting."
        : "No details found. Fill in the form below.",
    );
  };
  return (
    <section className="card mb">
      <div className="card-b">
        <h2>Paste a customer message</h2>
        <p className="muted small">
          Extract contact details, then check them before you log the enquiry.
        </p>
        <textarea
          className="inp"
          aria-label="Customer message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="button" className="btn btn-line mt-s" onClick={extract}>
          Extract details
        </button>
        {status && <p role="status">{status}</p>}
      </div>
    </section>
  );
}
export function FaultHintsProvider({ hints, children }) {
  return (
    <FaultContext.Provider value={hints}>{children}</FaultContext.Provider>
  );
}
export function FaultHint({ children, style, ...props }) {
  const [hint, setHint] = useState("");
  const hints = useContext(FaultContext);
  // The input owns its value; React's bubbling change event feeds the hint region.
  const api = useApi();
  const current = api?.fieldValues?.fault_code || "";
  useEffect(() => setHint(hints[current] || ""), [current, hints]);
  return hint ? (
    <div {...props} style={{ ...style, display: "block" }} role="status">
      <b>Diagnostic hint:</b> {hint}
    </div>
  ) : null;
}
