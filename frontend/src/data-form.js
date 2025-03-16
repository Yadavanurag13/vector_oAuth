import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Fade,
} from "@mui/material";
import styled from "@emotion/styled";
import axios from "axios";

const StyledCard = styled(Card)`
  backdrop-filter: blur(20px);
  background-color: rgba(255, 255, 255, 0.95);
  transition: transform 0.3s ease;
  border-radius: 16px;

  &:hover {
    transform: translateY(-4px);
  }
`;

const ActionButton = styled(Button)`
  padding: 10px 24px;
  border-radius: 8px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const endpointMapping = {
  Notion: "notion",
  Airtable: "airtable",
  HubSpot: "hubspot",
};

export const DataForm = ({ integrationType, credentials }) => {
  const [loadedData, setLoadedData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endpoint = endpointMapping[integrationType] || "";

  const handleLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("credentials", JSON.stringify(credentials));
      const response = await axios.post(
        `http://localhost:8000/integrations/${endpoint}/load`,
        formData
      );
      setLoadedData(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error?.response?.data?.detail || "Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setLoadedData("");
    setError(null);
  };

  return (
    <Fade in={true} timeout={500}>
      <StyledCard>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 3,
            }}
          >
            Data from {integrationType}
          </Typography>

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
          >
            {error && (
              <Alert
                severity="error"
                sx={{ width: "100%", borderRadius: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <TextField
              label="Loaded Data"
              multiline
              rows={10}
              value={loadedData}
              sx={{
                width: "100%",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                },
              }}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
              variant="outlined"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <ActionButton
                onClick={handleLoad}
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={
                  loading && <CircularProgress size={20} color="inherit" />
                }
              >
                {loading ? "Loading..." : "Load Data"}
              </ActionButton>

              <ActionButton
                onClick={handleClear}
                variant="outlined"
                color="secondary"
                disabled={loading || !loadedData}
              >
                Clear Data
              </ActionButton>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>
    </Fade>
  );
};
