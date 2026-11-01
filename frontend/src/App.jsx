import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  LinearProgress,
  ThemeProvider,
} from "@mui/material";
import { theme } from "./theme";
import { PublicFooter, PublicHeader } from "./components/Common";
import { NativePage } from "./components/NativeRuntime";
import { ApiContext } from "./lib/PageContext";
import { apiUrl, requestPage } from "./lib/api";
const Shell = lazy(() => import("./components/Shell"));
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Enquiry = lazy(() => import("./pages/Enquiry"));
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Projects = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Projects })),
);
const Settings = lazy(() => import("./pages/Settings"));
const Warehouse = lazy(() => import('./pages/Warehouse'));

class FrontendBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Box sx={{ p: 4, maxWidth: 700, mx: "auto" }}>
        <Alert severity="error">
          This page could not finish loading. Reload to try again.
        </Alert>
        <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
          Reload page
        </Button>
        <Button component="a" href="/">
          Go to home
        </Button>
      </Box>
    ) : (
      this.props.children
    );
  }
}

export default function App() {
  const [payload, setPayload] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [fieldValues, setFieldValues] = useState({});
  const active = useRef(null),
    mutation = useRef(false),
    version = useRef(0);
  const load = useCallback(
    async (path, { replace = false, flash = [], history = true } = {}) => {
      const current = ++version.current;
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setBusy(true);
      setError("");
      try {
        let next = path,
          result;
        for (let i = 0; i < 8; i++) {
          result = await requestPage(next, { signal: controller.signal });
          if (!result.redirect) break;
          flash = [...flash, ...(result.messages || [])];
          next = result.redirect;
        }
        if (!result?.state) throw Error("This page could not be loaded.");
        if (current !== version.current) return;
        const destination = new URL(next, window.location.href);
        if (destination.origin !== window.location.origin)
          throw Error("Invalid page destination.");
        if (history)
          window.history[replace ? "replaceState" : "pushState"](
            {},
            "",
            destination.pathname + destination.search + destination.hash,
          );
        result.state.messages = [...flash, ...(result.state.messages || [])];
        setPayload(result);
        setRevision((n) => n + 1);
        setFieldValues({});
        document.title = result.state.title || "SunPower";
        window.scrollTo({ top: 0, behavior: "instant" });
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        if (current === version.current) setBusy(false);
      }
    },
    [],
  );
  useEffect(() => {
    load(window.location.pathname + window.location.search, { replace: true });
    const pop = () =>
      load(window.location.pathname + window.location.search, {
        history: false,
      });
    window.addEventListener("popstate", pop);
    return () => {
      active.current?.abort();
      window.removeEventListener("popstate", pop);
    };
  }, [load]);
  const action = async (path, body, { raw = false } = {}) => {
    const result = await requestPage(path, {
      method: "POST",
      body,
      csrf: payload?.state.csrf,
    });
    if (raw) return result;
    if (result.redirect)
      await load(result.redirect, { flash: result.messages || [] });
    else if (result.state) {
      setPayload(result);
      setRevision((n) => n + 1);
      setFieldValues({});
    } else
      await load(window.location.pathname + window.location.search, {
        flash: result.messages || [],
      });
    return result;
  };
  async function submit(e) {
    if (e.defaultPrevented) return;
    const form = e.target;
    if (form.tagName !== "FORM") return;
    e.preventDefault();
    if (mutation.current) return;
    const button = e.nativeEvent.submitter;
    if (
      button?.classList.contains("is-disabled") ||
      button?.getAttribute("aria-disabled") === "true"
    )
      return;
    if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) return;
    // A control named "method" shadows form.method in browsers (payment forms).
    const method = (form.getAttribute("method") || "get").toUpperCase();
    const destination = new URL(
      form.getAttribute("action") || window.location.href,
      window.location.href,
    );
    const body = new FormData(form);
    if (button?.name) body.append(button.name, button.value);
    if (method === "GET") {
      body.delete("csrfmiddlewaretoken");
      destination.search = new URLSearchParams(body).toString();
      load(destination.pathname + destination.search);
      return;
    }
    mutation.current = true;
    setBusy(true);
    setError("");
    try {
      await action(destination.pathname + destination.search, body);
    } catch (err) {
      setError(err.message);
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }
  function click(e) {
    const a = e.target.closest("a[href]");
    if (
      !a ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      a.target === "_blank"
    )
      return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || !/^https?:/.test(url.protocol))
      return;
    if (
      url.hash &&
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    )
      return;
    if (/\.csv$/.test(url.pathname)) {
      e.preventDefault();
      window.location.assign(apiUrl(url.pathname + url.search));
      return;
    }
    if (url.pathname.startsWith("/media/")) return;
    e.preventDefault();
    load(url.pathname + url.search + url.hash);
  }
  const state = payload?.state;
  let content;
  if (!state)
    content = (
      <Box sx={{ p: 5, textAlign: "center" }} role="status">
        {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
      </Box>
    );
  else if (state.page === "landing") content = <Landing state={state} />;
  else if (state.page === "login" || state.page === "otp" || state.page === "employee_login")
    content = <Auth state={state} />;
  else {
    const page =
      state.page === "enquire" ? (
        <Enquiry state={state} />
      ) : state.page === "dashboard" ? (
        <Dashboard state={state} />
      ) : state.page === "projects" ? (
        <Projects state={state} />
      ) : payload.page.startsWith('warehouse/') ? (
        <Warehouse state={state} data={payload.data}/>
      ) : payload.page === "settings" ? (
        <Settings state={state} data={payload.data} />
      ) : (
        <NativePage page={payload.page} data={payload.data} state={state} />
      );
    content = payload.page.startsWith("docs/") ? (
      page
    ) : state.user ? (
      <Shell state={state}>{page}</Shell>
    ) : (
      <>
        <PublicHeader user={null} />
        {page}
        <PublicFooter />
      </>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ApiContext.Provider value={{ state, load, action, fieldValues }}>
        <div
          className="r-app"
          onSubmit={submit}
          onClick={click}
          onChange={(e) => {
            if (e.target.name === "fault_code")
              setFieldValues((old) => ({
                ...old,
                [e.target.name]: e.target.value,
              }));
          }}
          aria-busy={busy}
        >
          <a className="react-skip-link" href="#main-content">
            Skip to content
          </a>
          {busy && (
            <LinearProgress
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 2000,
              }}
            />
          )}
          {error && state && (
            <Alert
              severity="error"
              sx={{ position: "sticky", top: 0, zIndex: 1500 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}
          <FrontendBoundary key={revision}>
            <Suspense
              fallback={
                <Box
                  role="status"
                  sx={{
                    minHeight: "80dvh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <CircularProgress size={24} />
                  Loading your solar space…
                </Box>
              }
            >
              {content}
            </Suspense>
          </FrontendBoundary>
        </div>
      </ApiContext.Provider>
    </ThemeProvider>
  );
}
