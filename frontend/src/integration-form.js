import React, { useState } from "react";
import {
  Box,
  Autocomplete,
  TextField,
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import { AirtableIntegration } from "./integrations/airtable";
import { NotionIntegration } from "./integrations/notion";
import { HubspotIntegration } from "./integrations/hubspot";
import { DataForm } from "./data-form";
import { motion } from "framer-motion";
import styled from "@emotion/styled";

const integrationMapping = {
  Notion: NotionIntegration,
  Airtable: AirtableIntegration,
  HubSpot: HubspotIntegration,
};

const StyledCard = styled(motion(Card))`
  border-radius: 16px;
  backdrop-filter: blur(20px);
  background-color: rgba(255, 255, 255, 0.95);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.95);
    }
  }
`;

export const IntegrationForm = () => {
  const [integrationParams, setIntegrationParams] = useState({});
  const [user, setUser] = useState("TestUser");
  const [org, setOrg] = useState("TestOrg");
  const [currType, setCurrType] = useState(null);

  const CurrIntegration = currType ? integrationMapping[currType] : null;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 6,
        px: 3,
      }}
    >
      <Container maxWidth="md">
        <StyledCard
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5 }}
          sx={{ mb: 4 }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h3"
              align="center"
              sx={{
                mb: 4,
                fontWeight: 700,
                background: "linear-gradient(45deg, #2563eb, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              Integration Connector
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <StyledTextField
                  label="User"
                  variant="outlined"
                  fullWidth
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <StyledTextField
                  label="Organization"
                  variant="outlined"
                  fullWidth
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  id="integration-type"
                  options={Object.keys(integrationMapping)}
                  renderInput={(params) => (
                    <StyledTextField
                      {...params}
                      label="Integration Type"
                      variant="outlined"
                    />
                  )}
                  onChange={(e, value) => setCurrType(value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>

        {currType && CurrIntegration && (
          <StyledCard
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{ mb: 4 }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                align="center"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                Connect to {currType}
              </Typography>
              <CurrIntegration
                user={user}
                org={org}
                integrationParams={integrationParams}
                setIntegrationParams={setIntegrationParams}
              />
            </CardContent>
          </StyledCard>
        )}

        {integrationParams?.credentials && (
          <StyledCard
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                align="center"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                Loaded Data from {integrationParams.type}
              </Typography>
              <DataForm
                integrationType={integrationParams.type}
                credentials={integrationParams.credentials}
              />
            </CardContent>
          </StyledCard>
        )}
      </Container>
    </Box>
  );
};
