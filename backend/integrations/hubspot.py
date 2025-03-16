import os
import json
import secrets
import logging
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import asyncio
import base64
from datetime import datetime
from integrations.integration_item import IntegrationItem
from redis_client import add_key_value_redis, get_value_redis, delete_key_redis

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# HubSpot credentials and URLs
CLIENT_ID = 'c252eba1-79cf-48a4-80b1-6286b66756cf'
CLIENT_SECRET = 'd03a8740-14f1-46d9-8852-de49149d9c7a'
REDIRECT_URI = 'http://localhost:8000/integrations/hubspot/oauth2callback'

# Define additional scopes needed for your app.
ADDITIONAL_SCOPES = "crm.objects.contacts.read"  # Add other scopes as needed

# Combine the required and additional scopes. HubSpot expects scopes to be space-separated.
combined_scopes = f"oauth {ADDITIONAL_SCOPES}"

# Build the authorization URL dynamically, replacing spaces with %20 for URL encoding.
authorization_url = (
    f"https://app-na2.hubspot.com/oauth/authorize?"
    f"client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope={combined_scopes.replace(' ', '%20')}"
)

# Encode credentials for potential use in Basic Auth (if required)
encoded_client_id_secret = base64.b64encode(f'{CLIENT_ID}:{CLIENT_SECRET}'.encode()).decode()

async def authorize_hubspot(user_id, org_id):
    """Starts the OAuth process for HubSpot by generating a state value and returning the authorization URL."""
    logger.info("Starting HubSpot OAuth for user '%s' in org '%s'", user_id, org_id)
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    encoded_state = json.dumps(state_data)
    await add_key_value_redis(f'hubspot_state:{org_id}:{user_id}', encoded_state, expire=600)
    logger.info("Stored state in Redis: %s", encoded_state)
    auth_url = f'{authorization_url}&state={encoded_state}'
    logger.info("Returning authorization URL: %s", auth_url)
    return auth_url

async def oauth2callback_hubspot(request: Request):
    """Handles the OAuth callback from HubSpot: validates state, exchanges the authorization code for tokens, and stores credentials."""
    logger.info("Received OAuth callback with query params: %s", request.query_params)
    if request.query_params.get('error'):
        error_detail = request.query_params.get('error')
        logger.error("OAuth callback error: %s", error_detail)
        raise HTTPException(status_code=400, detail=error_detail)
    
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    state_data = json.loads(encoded_state)
    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')
    logger.info("Decoded state data: %s", state_data)

    saved_state = await get_value_redis(f'hubspot_state:{org_id}:{user_id}')
    if not saved_state or original_state != json.loads(saved_state).get('state'):
        logger.error("State mismatch: received %s, expected %s", original_state, json.loads(saved_state).get('state') if saved_state else None)
        raise HTTPException(status_code=400, detail='State does not match.')
    
    await delete_key_redis(f'hubspot_state:{org_id}:{user_id}')
    logger.info("Deleted stored state for user '%s' in org '%s'", user_id, org_id)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://api.hubapi.com/oauth/v1/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': REDIRECT_URI,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET
            },
            headers={
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        )
    
    if response.status_code != 200:
        logger.error("Error exchanging code for tokens. Status: %s, Response: %s", response.status_code, response.text)
        raise HTTPException(status_code=response.status_code, detail="Error exchanging code for tokens.")
    
    credentials = response.json()
    logger.info("Received credentials: %s", credentials)
    await add_key_value_redis(f'hubspot_credentials:{org_id}:{user_id}', json.dumps(credentials), expire=600)
    logger.info("Stored credentials in Redis for user '%s' in org '%s'", user_id, org_id)
    
    close_window_script = """
    <html>
        <script>
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)

async def get_hubspot_credentials(user_id, org_id):
    """Retrieves and deletes the stored HubSpot credentials from Redis."""
    logger.info("Retrieving credentials for user '%s' in org '%s'", user_id, org_id)
    credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
    if not credentials:
        logger.error("No credentials found for user '%s' in org '%s'", user_id, org_id)
        raise HTTPException(status_code=400, detail='No credentials found.')
    
    credentials = json.loads(credentials)
    await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')
    logger.info("Retrieved and deleted credentials: %s", credentials)
    return credentials

def parse_datetime(dt_str):
    """Helper function to parse an ISO datetime string (removing trailing 'Z' if present)."""
    if dt_str:
        dt_str = dt_str.rstrip("Z")
        try:
            return datetime.fromisoformat(dt_str)
        except Exception as e:
            logger.error("Error parsing datetime '%s': %s", dt_str, e)
            return None
    return None

async def create_integration_item_metadata_object(response_json):
    """
    Maps a HubSpot contact response to an IntegrationItem object.
    Expected structure for a contact:
    {
      "id": "123456",
      "properties": {
          "firstname": "John",
          "lastname": "Doe",
          "email": "john@example.com",
          "createdate": "2021-01-01T00:00:00.000Z",
          "lastmodifieddate": "2021-01-02T00:00:00.000Z"
      },
      "archived": false,
      "portalId": 12345,
      "objectType": "contact"
    }
    """
    item_id = response_json.get("id")
    properties = response_json.get("properties", {})
    firstname = properties.get("firstname", "")
    lastname = properties.get("lastname", "")
    name = f"{firstname} {lastname}".strip() or properties.get("email", f"HubSpot Item {item_id}")
    creation_time = parse_datetime(properties.get("createdate"))
    last_modified_time = parse_datetime(properties.get("lastmodifieddate"))
    
    integration_item = IntegrationItem(
        id=item_id,
        type="hubspot",
        name=name,
        creation_time=creation_time,
        last_modified_time=last_modified_time,
        parent_id=None
    )
    logger.info("Created IntegrationItem: %s", integration_item)
    return integration_item

async def get_items_hubspot(credentials) -> list[IntegrationItem]:
    """
    Retrieves HubSpot contacts using the access token from the credentials,
    maps each contact to an IntegrationItem, logs the retrieved data, and returns the list.
    """
    if isinstance(credentials, str):
        credentials = json.loads(credentials)
    access_token = credentials.get("access_token")
    logger.info("Using access token: %s", access_token)
    if not access_token:
        logger.error("Access token is missing in credentials: %s", credentials)
        raise HTTPException(status_code=400, detail="Access token is missing in credentials.")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    url = "https://api.hubapi.com/crm/v3/objects/contacts"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params={"limit": 10})
    
    if response.status_code != 200:
        logger.error("Error fetching HubSpot items. Status: %s, Response: %s", response.status_code, response.text)
        raise HTTPException(status_code=response.status_code, detail="Error fetching HubSpot items.")
    
    data = response.json()
    results = data.get("results", [])
    logger.info("Fetched %d HubSpot contacts", len(results))
    integration_items = []
    
    for item in results:
        integration_item = await create_integration_item_metadata_object(item)
        integration_items.append(integration_item)
    
    logger.info("Returning %d IntegrationItems", len(integration_items))
    return integration_items