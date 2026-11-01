import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Csrf, Messages, PageHeading } from "../components/Common";
export default function Settings({ state, data }) {
  return (
    <main id="main-content" tabIndex={-1}>
      <Messages messages={state.messages} />
      <PageHeading
        title="Business settings"
        description="Update company details and the rules used for new workflow decisions."
      />
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" method="post" action="/app/settings/">
          <Csrf value={state.csrf} />
          <Stack spacing={2.5}>
            {Object.entries(data.values).map(([key, value]) => (
              <TextField
                key={key}
                name={key}
                label={key.replaceAll("_", " ")}
                defaultValue={
                  typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : value
                }
                multiline={typeof value === "object"}
                minRows={typeof value === "object" ? 3 : undefined}
                type={typeof value === "number" ? "number" : "text"}
                slotProps={{
                  htmlInput:
                    typeof value === "number"
                      ? { step: "any", min: 0 }
                      : undefined,
                }}
              />
            ))}
            <Button type="submit" variant="contained" color="secondary">
              Save settings
            </Button>
          </Stack>
        </Box>
      </Paper>
    </main>
  );
}
