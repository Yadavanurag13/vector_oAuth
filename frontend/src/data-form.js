import React, { useState } from "react";
import { Box, TextField, Button, Card, CardContent, Typography } from "@mui/material";
import axios from "axios";

const endpointMapping = {
  Notion: "notion",
  Airtable: "airtable",
  HubSpot: "hubspot",
};

export const DataForm = ({ integrationType, credentials }) => {
  const [loadedData, setLoadedData] = useState("");
  const endpoint = endpointMapping[integrationType] || "";

  const handleLoad = async () => {
    try {
      const formData = new FormData();
      formData.append("credentials", JSON.stringify(credentials));
      const response = await axios.post(
        `http://localhost:8000/integrations/${endpoint}/load`,
        formData
      );
      setLoadedData(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error?.response?.data?.detail || "Error loading data");
    }
  };

  return (
    <Card sx={{ my: 2, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" align="center" gutterBottom>
          Data Loader
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center">
          <TextField
            label="Loaded Data"
            multiline
            rows={10}
            value={loadedData}
            sx={{ mt: 2, width: "100%" }}
            InputLabelProps={{ shrink: true }}
            disabled
            variant="outlined"
          />
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button onClick={handleLoad} variant="contained" color="primary">
              Load Data
            </Button>
            <Button onClick={() => setLoadedData("")} variant="contained" color="secondary">
              Clear Data
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};