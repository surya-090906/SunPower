import { Box, Button, Chip, Paper, Typography } from "@mui/material";
export default function SystemSupport({ support }) {
  if (!support?.available) return null;
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ p: 2.5, mt: 2 }}
      aria-label="Warranty and support"
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography component="h3" variant="h3">
            Warranty and support
          </Typography>
          <Chip
            size="small"
            label={support.warrantyLabel}
            color={support.coveredUnits ? "success" : "default"}
            sx={{ my: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Installation complete. Select the equipment and describe the problem
            to request a service visit.
          </Typography>
        </Box>
        <Button
          component="a"
          href={support.url}
          variant="contained"
          color="secondary"
        >
          Report a problem
        </Button>
      </Box>
    </Paper>
  );
}
