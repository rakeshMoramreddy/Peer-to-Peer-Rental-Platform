# P2P Rental Platform API

A Node.js REST API for a peer-to-peer rental platform where users can list and rent items.

## Features
- List items for rent
- Search items by name and price range
- Create and manage rentals
- Handle rental date conflicts
- In-memory caching for frequent searches
- Rental history tracking

## Prerequisites
- Node.js (v14+)
- npm or yarn
- Postman (for testing)

## Setup & Installation

1. Clone repository:
```bash
git clone https://github.com/rakeshMoramreddy/Peer-to-Peer-Rental-Platform.git
cd Peer-to-Peer-Rental-Platform
```

2. Install dependencies:
```bash
npm install
```

3. Start server:
```bash
npm start
# or
node server.js
```

Server runs on http://localhost:3000

## API Routes

### Items

#### Create Item
```
POST /api/items
Content-Type: application/json

{
    "name": "Electric Drill",
    "description": "Professional grade power drill",
    "price": 25
}

Response:
{
    "id": "generated_id",
    "name": "Electric Drill",
    "description": "Professional grade power drill",
    "price": 25,
    "created": "2025-01-26T10:00:00.000Z",
    "isAvailable": true
}
```

#### Search Items
```
GET /api/items?search=drill&minPrice=20&maxPrice=30

Query Parameters:
- search: Search term for name/description
- minPrice: Minimum price filter
- maxPrice: Maximum price filter

Response:
[
    {
        "id": "item_id",
        "name": "Electric Drill",
        "description": "Professional grade power drill",
        "price": 25,
        "created": "2025-01-26T10:00:00.000Z",
        "isAvailable": true
    }
]
```

#### Get Item Rental History
```
GET /api/items/:id/history

Response:
[
    {
        "id": "rental_id",
        "itemId": "item_id",
        "startDate": "2025-01-27",
        "endDate": "2025-01-29",
        "status": "active",
        "created": "2025-01-26T10:00:00.000Z"
    }
]
```

### Rentals

#### Create Rental
```
POST /api/rentals
Content-Type: application/json

{
    "itemId": "item_id",
    "startDate": "2025-01-27",
    "endDate": "2025-01-29"
}

Response:
{
    "id": "rental_id",
    "itemId": "item_id",
    "startDate": "2025-01-27",
    "endDate": "2025-01-29",
    "status": "active",
    "created": "2025-01-26T10:00:00.000Z"
}
```

#### Return Item
```
POST /api/rentals/:id/return

Response:
{
    "id": "rental_id",
    "itemId": "item_id",
    "startDate": "2025-01-27",
    "endDate": "2025-01-29",
    "status": "returned",
    "created": "2025-01-26T10:00:00.000Z",
    "returnDate": "2025-01-26T15:00:00.000Z"
}
```

## Testing with Postman

### Environment Setup
1. Open Postman
2. Create new Environment:
   - Name: "Rental Platform"
   - Variables:
     - baseUrl: http://localhost:3000
     - itemId: (leave empty)
     - rentalId: (leave empty)
3. Save environment

### Import Collection
1. Click "Import" in Postman
2. Import the `postman-collection.json` file from the repository
3. Select the "Rental Platform" environment from dropdown

### Test Flow
1. Create Item
   - Execute "Create Item" request
   - itemId saves automatically
2. Search Items
   - Verify item appears in results
3. Create Rental
   - Execute with saved itemId
   - rentalId saves automatically
4. Check Rental History
   - Verify rental in item history
5. Return Item
   - Execute return with saved rentalId
   - Verify status changed to "returned"

## Code Structure

### Core Components
- **Server Setup**: Express.js configuration
- **Data Storage**: In-memory arrays for items and rentals
- **Caching**: Map-based cache for frequent searches
- **Date Handling**: Validation for rental dates
- **Error Handling**: Try-catch blocks with specific error messages

### Key Functions
- `createId()`: Generate unique IDs
- `checkDates()`: Validate rental date ranges
- `getCached()`: Retrieve cached search results
- Conflict detection for rental dates

## Error Handling
- 400: Bad Request (Invalid input)
  - Missing required fields
  - Invalid dates
  - Item already booked
- 404: Not Found
  - Item not found
  - Rental not found
- 500: Server Error
  - Unexpected errors

## Limitations
- In-memory storage (data lost on restart)
- No authentication/authorization
- No data persistence
- No payment processing
- No email notifications