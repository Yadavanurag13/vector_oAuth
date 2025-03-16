// notion.js

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

const NotionLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h16v16H4V4zm1 1v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
  </svg>
);

export const NotionIntegration = ({
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
        `http://localhost:8000/integrations/notion/authorize`,
        formData
      );
      console.log(response);
      const authURL = response?.data;

      const newWindow = window.open(
        authURL,
        "Notion Authorization",
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
        `http://localhost:8000/integrations/notion/credentials`,
        formData
      );
      const credentials = response.data;
      if (credentials) {
        setIsConnecting(false);
        setIsConnected(true);
        setIntegrationParams((prev) => ({
          ...prev,
          credentials: credentials,
          type: "Notion",
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
          Connect your Notion workspace to sync pages, databases, and
          collaborate seamlessly.
        </Typography>

        <ConnectButton
          variant="contained"
          onClick={isConnected ? () => {} : handleConnectClick}
          color={isConnected ? "success" : "primary"}
          disabled={isConnecting}
          startIcon={!isConnecting && <NotionLogo />}
          sx={{
            pointerEvents: isConnected ? "none" : "auto",
            cursor: isConnected ? "default" : "pointer",
            opacity: isConnected ? 1 : undefined,
          }}
        >
          {isConnected ? (
            <>✓ Connected to Notion</>
          ) : isConnecting ? (
            <>
              <StyledCircularProgress size={20} color="inherit" />
              Connecting...
            </>
          ) : (
            "Connect to Notion"
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
            }}
          >
            Your Notion workspace is successfully connected
          </Typography>
        )}
      </Box>
    </Fade>
  );
};
