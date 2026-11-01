import { useRef, useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Csrf, Messages, PageHeading } from "../components/Common";

function BundleForm({ bundle, customer, state, action, children }) {
  return (
    <Box
      component="form"
      method="post"
      action={`/app/inventory/dispatch/${bundle.id}/do/`}
    >
      <Csrf value={state.csrf} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="return_customer" value={customer.id} />
      {children}
    </Box>
  );
}

function MaterialScanForm({ bundle, customer, state, autoFocus }) {
  const [code, setCode] = useState("");
  const input = useRef(null);
  return (
    <BundleForm
      bundle={bundle}
      customer={customer}
      state={state}
      action="scan_material"
    >
      <Stack spacing={2} sx={{ mb: 3 }}>
        <BarcodeScanner
          onDetected={(value) => {
            setCode(value);
            input.current?.focus();
          }}
        />
        <TextField
          inputRef={input}
          label={`Scan serial number or material SKU for ${bundle.code}`}
          name="code"
          required
          autoComplete="off"
          autoFocus={autoFocus}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          helperText="Use the camera, a USB/Bluetooth barcode scanner, or type the code. For tracked items scan the unique serial; for loose materials scan the SKU."
        />
        <TextField
          label="Quantity for loose materials (optional)"
          name="qty"
          type="number"
          slotProps={{ htmlInput: { min: 0.01, step: "any" } }}
          helperText="Leave empty for one unit. Serial-tracked units must be scanned individually."
        />
        <Button type="submit" variant="contained">
          Scan &amp; link to {customer.name}
        </Button>
      </Stack>
    </BundleForm>
  );
}

export default function Warehouse({ data, state }) {
  const customer = data.customer;
  return (
    <main id="main-content" tabIndex={-1}>
      <Messages messages={state.messages} />
      {customer && (
        <Button component="a" href="/app/inventory/dispatch/" sx={{ mb: 2 }}>
          ‹ All customer bundles
        </Button>
      )}
      <PageHeading
        title={
          customer
            ? `${customer.name} — material bundles`
            : "Customer material bundles"
        }
        description={
          customer
            ? `${customer.phone} · Every scanned serial is linked to this customer and its installation order.`
            : "Open a customer to see their requested materials, scan each unit and prepare the bundle for dispatch."
        }
      />
      {!customer ? (
        <>
          <Box
            component="form"
            method="get"
            action="/app/inventory/dispatch/"
            sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}
          >
            <TextField
              label="Search customer, phone or order"
              name="q"
              defaultValue={data.q}
              sx={{ flex: 1, minWidth: 220 }}
            />
            <input type="hidden" name="status" value={data.status} />
            <Button type="submit" variant="outlined">
              Search
            </Button>
          </Box>
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
            {[
              ["open", "To prepare"],
              ["dispatched", "On the road"],
              ["delivered", "Delivered"],
              ["all", "All"],
            ].map(([status, label]) => (
              <Button
                key={status}
                component="a"
                href={`?status=${status}&q=${encodeURIComponent(data.q || "")}`}
                variant={data.status === status ? "contained" : "outlined"}
              >
                {label}
              </Button>
            ))}
          </Stack>
          <Stack spacing={2}>
            {data.customers.map((c) => (
              <Paper key={c.id} variant="outlined" sx={{ p: 3 }}>
                <Typography component="h2" variant="h3">
                  <a href={`/app/inventory/customers/${c.id}/`}>{c.name}</a>
                </Typography>
                <Typography color="text.secondary">{c.phone}</Typography>
                <Typography sx={{ my: 1 }}>
                  {c.bundles.length} material{" "}
                  {c.bundles.length === 1 ? "bundle" : "bundles"}
                </Typography>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {c.bundles.map((b) => (
                    <Typography variant="body2" key={b.id}>
                      {b.code} · {b.project} · {b.materials} material types ·{" "}
                      {b.status}
                    </Typography>
                  ))}
                </Stack>
                <Button
                  component="a"
                  href={`/app/inventory/customers/${c.id}/`}
                  variant="contained"
                >
                  Open customer bundle
                </Button>
              </Paper>
            ))}
            {!data.customers.length && (
              <Paper variant="outlined" sx={{ p: 4 }}>
                No customer bundles match this view.
              </Paper>
            )}
          </Stack>
        </>
      ) : (
        <Stack spacing={3}>
          {data.bundles.map((b, index) => (
            <Paper
              component="section"
              key={b.id}
              variant="outlined"
              sx={{ p: { xs: 2, md: 3 } }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                  mb: 1,
                }}
              >
                <Typography component="h2" variant="h3">
                  {b.code} · {b.project}
                </Typography>
                <Chip label={b.statusLabel} />
              </Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {b.address}
              </Typography>
              {b.status === "awaiting_stock" && (
                <Typography role="status" sx={{ mb: 2 }}>
                  Waiting for missing stock. Receive stock to release this
                  bundle for scanning.
                </Typography>
              )}
              {b.canScan && (
                <MaterialScanForm
                  bundle={b}
                  customer={customer}
                  state={state}
                  autoFocus={index === 0}
                />
              )}
              <TableContainer>
                <Table aria-label={`Materials in ${b.code}`}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Required</TableCell>
                      <TableCell align="right">Linked</TableCell>
                      <TableCell align="right">Remaining</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {b.lines.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>
                            {l.name}
                          </Typography>
                          <Typography variant="caption">
                            SKU: {l.sku} ·{" "}
                            {l.tracked
                              ? "Scan unique serials"
                              : "Scan SKU and quantity"}
                          </Typography>
                          <Stack
                            direction="row"
                            sx={{ gap: 1, flexWrap: "wrap", mt: 1 }}
                          >
                            {l.serials.map((s) => (
                              <Chip
                                key={s.id}
                                component="a"
                                href={`/app/inventory/serials/${s.id}/`}
                                label={s.number}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          {Number(l.required)}
                        </TableCell>
                        <TableCell align="right">{Number(l.picked)}</TableCell>
                        <TableCell align="right">
                          {l.complete ? "Complete" : Number(l.remaining)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {b.canDispatch && (
                <BundleForm
                  bundle={b}
                  customer={customer}
                  state={state}
                  action="dispatch"
                >
                  <Stack spacing={2} sx={{ mt: 3 }}>
                    <Typography>
                      Every required material is linked. This bundle is ready to
                      dispatch.
                    </Typography>
                    <TextField name="vehicle" label="Vehicle number" />
                    <TextField name="driver" label="Driver" />
                    <Button type="submit" variant="contained">
                      Dispatch {b.code}
                    </Button>
                  </Stack>
                </BundleForm>
              )}
              <Button
                component="a"
                href={`/app/inventory/dispatch/${b.id}/`}
                sx={{ mt: 2 }}
              >
                Delivery and dispatch details
              </Button>
            </Paper>
          ))}
          {!data.bundles.length && (
            <Typography>
              No warehouse requests for this customer yet.
            </Typography>
          )}
        </Stack>
      )}
    </main>
  );
}
