# Congressional Hearing Sync System

## Overview
This system fetches and syncs upcoming congressional hearings from two sources:
1. **Congress.gov API** - Official API for House and Senate committee meetings
2. **Senate.gov XML Feed** - Direct XML feed for Senate hearings

## Database
All hearings are stored in the `upcoming_committee_hearings` table with the following key fields:
- `event_id` - Unique identifier (prefixed with 'senate-' for Senate XML feed items)
- `chamber` - House/Senate
- `event_date` - Date and time of the hearing
- `title` - Hearing title/description
- `committee_name` - Committee name
- `location_building` & `location_room` - Physical location
- `meeting_status` - Current status (Scheduled/Postponed/Cancelled)
- `related_bills`, `related_nominations`, `meeting_documents` - Related materials (JSON)

## Manual Sync Commands

Run from the `apps/congressional-hearings` directory:

```bash
# Sync all sources (Congress.gov API + Senate XML)
pnpm run sync-all

# Sync only Congress.gov API
pnpm run sync-hearings

# Sync only Senate XML feed
pnpm run sync-senate
```

## Automatic Updates

The system is configured to automatically sync every day at 6:00 AM UTC via Vercel Cron. The cron job is configured in `vercel.json`:

```json
"crons": [{
  "path": "/api/cron/sync-hearings",
  "schedule": "0 6 * * *"
}]
```

## API Endpoints

### GET /api/hearings
Fetch hearings from the database.

Query parameters:
- `chamber` - Filter by chamber (House/Senate)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

Example:
```
GET /api/hearings?chamber=Senate&limit=10
```

### POST /api/hearings/sync
Manually trigger a sync (requires authentication).

Headers:
- `Authorization: Bearer <SYNC_SECRET_KEY>`

### GET /api/cron/sync-hearings
Cron endpoint for automatic syncing (called by Vercel Cron).

## Environment Variables

Required in `.env`:
```
CONGRESS_GOV_API_KEY=<your-api-key>
DB_HOST=<database-host>
DB_PORT=<database-port>
DB_DATABASE=<database-name>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
SYNC_SECRET_KEY=<secret-for-manual-sync>
CRON_SECRET=<secret-for-cron-jobs>
```

## Data Sources

### Congress.gov API
- Base URL: `https://api.congress.gov/v3/`
- Endpoints: `/committee-meeting` and `/hearing`
- Requires API key
- Provides detailed meeting information including bills, nominations, and documents

### Senate.gov XML Feed
- URL: `https://www.senate.gov/general/committee_schedules/hearings.xml`
- No authentication required
- Updates frequently with Senate committee schedules
- Includes meeting times, locations, and associated documents

## Frontend Integration

The `/upcoming` page displays all synced hearings with:
- Real-time filtering by chamber and status
- Search functionality
- Links to create prep sheets
- Direct links to Congress.gov for more details
- Automatic refresh button to fetch latest data

## Troubleshooting

### No hearings showing up
1. Check that the sync scripts have been run: `pnpm run sync-all`
2. Verify database connection in `.env`
3. Check API key is valid for Congress.gov

### Sync failing
1. Check Congress.gov API key is valid
2. Verify network access to both APIs
3. Check database connection and permissions
4. Review logs for specific error messages

### Duplicate entries
The system uses `event_id` as a unique key with UPSERT operations, so duplicates should not occur. Senate XML items are prefixed with 'senate-' to avoid ID collisions.

## Development

To add new data sources:
1. Create a new sync script in `scripts/`
2. Follow the pattern of `sync-hearings.ts` or `sync-senate-hearings.ts`
3. Add to `sync-all-hearings.ts` for combined syncing
4. Update package.json scripts if needed