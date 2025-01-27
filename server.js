const express = require('express');
const app = express();

// Basic setup
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Store everything in memory for now
// TODO: Replace with a real database later
let items = [];
let rentals = [];

// Utils
function createId() {
    return Math.random().toString(36).slice(2);
}

function checkDates(start, end) {
    let startDate = new Date(start);
    let endDate = new Date(end);
    let today = new Date();

    // Add time to dates for proper comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return startDate >= today && endDate > startDate;
}

// Cache frequently searched items
const searchCache = new Map();
const CACHE_TIME = 5 * 60 * 1000; // 5 min

function getCached(key) {
    const cached = searchCache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TIME) {
        return cached.data;
    }
    return null;
}

// Main routes
app.post('/api/items', (req, res) => {
    try {
        const { name, description, price } = req.body;

        // Quick validation
        if (!name?.trim() || !description?.trim() || !price) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        if (price <= 0) {
            return res.status(400).json({
                error: 'Price must be positive'
            });
        }

        const newItem = {
            id: createId(),
            name: name.trim(),
            description: description.trim(),
            price,
            created: new Date().toISOString(),
            isAvailable: true
        };

        items.push(newItem);
        res.status(201).json(newItem);
    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).json({
            error: 'Something went wrong'
        });
    }
});

app.get('/api/items', (req, res) => {
    try {
        const { search, minPrice, maxPrice } = req.query;

        // Check cache first
        const cacheKey = `${search}-${minPrice}-${maxPrice}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        // Filter items
        let results = [...items];

        if (search) {
            const searchLower = search.toLowerCase();
            results = results.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower)
            );
        }

        if (minPrice) {
            results = results.filter(item =>
                item.price >= parseFloat(minPrice)
            );
        }

        if (maxPrice) {
            results = results.filter(item =>
                item.price <= parseFloat(maxPrice)
            );
        }

        // Save to cache
        searchCache.set(cacheKey, {
            time: Date.now(),
            data: results
        });

        res.json(results);
    } catch (err) {
        console.error('Error searching items:', err);
        res.status(500).json({
            error: 'Search failed'
        });
    }
});

app.post('/api/rentals', (req, res) => {
    try {
        const { itemId, startDate, endDate } = req.body;

        // Validate input
        if (!itemId || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing rental details'
            });
        }

        // Find the item
        const item = items.find(i => i.id === itemId);
        if (!item) {
            return res.status(404).json({
                error: 'Item not found'
            });
        }

        if (!item.isAvailable) {
            return res.status(400).json({
                error: 'Item is not available'
            });
        }

        // Check dates
        if (!checkDates(startDate, endDate)) {
            return res.status(400).json({
                error: 'Invalid dates'
            });
        }

        // Check for conflicts
        const hasConflict = rentals.some(rental => {
            if (rental.itemId !== itemId || rental.status === 'returned') {
                return false;
            }

            const rentalStart = new Date(rental.startDate);
            const rentalEnd = new Date(rental.endDate);
            const newStart = new Date(startDate);
            const newEnd = new Date(endDate);

            // Check all possible overlaps
            return (
                (newStart >= rentalStart && newStart <= rentalEnd) ||
                (newEnd >= rentalStart && newEnd <= rentalEnd) ||
                (newStart <= rentalStart && newEnd >= rentalEnd)
            );
        });

        if (hasConflict) {
            return res.status(400).json({
                error: 'Item already booked for these dates'
            });
        }

        // Create rental
        const rental = {
            id: createId(),
            itemId,
            startDate,
            endDate,
            status: 'active',
            created: new Date().toISOString()
        };

        rentals.push(rental);
        res.status(201).json(rental);
    } catch (err) {
        console.error('Error creating rental:', err);
        res.status(500).json({
            error: 'Rental failed'
        });
    }
});

app.post('/api/rentals/:id/return', (req, res) => {
    try {
        const { id } = req.params;

        const rental = rentals.find(r => r.id === id);
        if (!rental) {
            return res.status(404).json({
                error: 'Rental not found'
            });
        }

        if (rental.status === 'returned') {
            return res.status(400).json({
                error: 'Item already returned'
            });
        }

        rental.status = 'returned';
        rental.returnDate = new Date().toISOString();

        const item = items.find(i => i.id === rental.itemId);
        if (item) {
            item.isAvailable = true;
        }

        res.json(rental);
    } catch (err) {
        console.error('Error returning item:', err);
        res.status(500).json({
            error: 'Return failed'
        });
    }
});

// Get rental history
app.get('/api/items/:id/history', (req, res) => {
    try {
        const { id } = req.params;

        const item = items.find(i => i.id === id);
        if (!item) {
            return res.status(404).json({
                error: 'Item not found'
            });
        }

        const history = rentals
            .filter(r => r.itemId === id)
            .sort((a, b) => new Date(b.created) - new Date(a.created));

        res.json(history);
    } catch (err) {
        console.error('Error getting history:', err);
        res.status(500).json({
            error: 'Could not get rental history'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});