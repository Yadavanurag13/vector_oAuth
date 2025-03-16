// airtable.js

import { useState, useEffect } from "react";
import { Box, Button, CircularProgress, Typography, Fade } from "@mui/material";
import axios from "axios";
import styled from "@emotion/styled";

const ConnectButton = styled(Button)`
  padding: 12px 24px;
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
  transition: all 0.2s ease;
  min-width: 200px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const StyledCircularProgress = styled(CircularProgress)`
  margin-right: 8px;
`;

const AirtableLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H4c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1z" />
  </svg>
);

export const AirtableIntegration = ({
  user,
  org,
  integrationParams,
  setIntegrationParams,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Function to open OAuth in a new window
  const handleConnectClick = async () => {
    try {
      setIsConnecting(true);
      const formData = new FormData();
      formData.append("user_id", user);
      formData.append("org_id", org);
      const response = await axios.post(
        `http://localhost:8000/integrations/airtable/authorize`,
        formData
      );
      const authURL = response?.data;

      const newWindow = window.open(
        authURL,
        "Airtable Authorization",
        "width=600, height=600"
      );

      // Polling for the window to close
      const pollTimer = window.setInterval(() => {
        if (newWindow?.closed !== false) {
          window.clearInterval(pollTimer);
          handleWindowClosed();
        }
      }, 200);
    } catch (e) {
      setIsConnecting(false);
      alert(e?.response?.data?.detail);
    }
  };

  // Function to handle logic when the OAuth window closes
  const handleWindowClosed = async () => {
    try {
      const formData = new FormData();
      formData.append("user_id", user);
      formData.append("org_id", org);
      const response = await axios.post(
        `http://localhost:8000/integrations/airtable/credentials`,
        formData
      );
      const credentials = response.data;
      if (credentials) {
        setIsConnecting(false);
        setIsConnected(true);
        setIntegrationParams((prev) => ({
          ...prev,
          credentials: credentials,
          type: "Airtable",
        }));
      }
      setIsConnecting(false);
    } catch (e) {
      setIsConnecting(false);
      alert(e?.response?.data?.detail);
    }
  };

  useEffect(() => {
    setIsConnected(!!integrationParams?.credentials);
  }, [integrationParams]);

  return (
    <Fade in={true} timeout={500}>
      <Box
        sx={{
          mt: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            maxWidth: "400px",
            mb: 2,
          }}
        >
          Connect your Airtable workspace to sync databases, tables, and manage
          your data seamlessly.
        </Typography>

        <ConnectButton
          variant="contained"
          onClick={isConnected ? () => {} : handleConnectClick}
          color={isConnected ? "success" : "primary"}
          disabled={isConnecting}
          startIcon={!isConnecting && <AirtableLogo />}
          sx={{
            pointerEvents: isConnected ? "none" : "auto",
            cursor: isConnected ? "default" : "pointer",
            opacity: isConnected ? 1 : undefined,
            backgroundColor: isConnected ? "#00a86b" : "#2563eb",
            "&:hover": {
              backgroundColor: isConnected ? "#00a86b" : "#1d4ed8",
            },
          }}
        >
          {isConnected ? (
            <>✓ Connected to Airtable</>
          ) : isConnecting ? (
            <>
              <StyledCircularProgress size={20} color="inherit" />
              Connecting...
            </>
          ) : (
            "Connect to Airtable"
          )}
        </ConnectButton>

        {isConnected && (
          <Typography
            variant="body2"
            sx={{
              color: "success.main",
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 500,
            }}
          >
            Your Airtable workspace is successfully connected
          </Typography>
        )}
      </Box>
    </Fade>
  );
};
