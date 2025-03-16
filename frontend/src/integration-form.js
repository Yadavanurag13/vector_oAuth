import React, { useState } from 'react';
import { Box, Autocomplete, TextField, Card, CardContent, Typography, Grid } from '@mui/material';
import { AirtableIntegration } from './integrations/airtable';
import { NotionIntegration } from './integrations/notion';
import { HubspotIntegration } from './integrations/hubspot';
import { DataForm } from './data-form';

const integrationMapping = {
  Notion: NotionIntegration,
  Airtable: AirtableIntegration,
  HubSpot: HubspotIntegration,
};

export const IntegrationForm = () => {
  const [integrationParams, setIntegrationParams] = useState({});
  const [user, setUser] = useState('TestUser');
  const [org, setOrg] = useState('TestOrg');
  const [currType, setCurrType] = useState(null);

  const CurrIntegration = currType ? integrationMapping[currType] : null;

  return (
    <Box sx={{ p: 4, minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      <Card sx={{ maxWidth: 600, mx: 'auto', mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom>
            Integration Connector
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="User"
                variant="outlined"
                fullWidth
                value={user}
                onChange={(e) => setUser(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
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
                renderInput={(params) => <TextField {...params} label="Integration Type" variant="outlined" />}
                onChange={(e, value) => setCurrType(value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {currType && CurrIntegration && (
        <Card sx={{ maxWidth: 600, mx: 'auto', mb: 4, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Connect to {currType}
            </Typography>
            <CurrIntegration user={user} org={org} integrationParams={integrationParams} setIntegrationParams={setIntegrationParams} />
          </CardContent>
        </Card>
      )}

      {integrationParams?.credentials && (
        <Card sx={{ maxWidth: 600, mx: 'auto', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Loaded Data from {integrationParams.type}
            </Typography>
            <DataForm integrationType={integrationParams.type} credentials={integrationParams.credentials} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};