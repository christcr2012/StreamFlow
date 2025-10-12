# @cortiware/routing

Route planning and optimization engine for service-based businesses.

## Overview

This package provides routing algorithms for optimizing service routes, particularly for:
- Waste management (rolloff, port-a-john)
- Service businesses with pickup/drop-off operations
- Multi-stop route planning with capacity constraints
- Landfill/dump site selection

Features:
- Simple greedy routing algorithm
- Capacity-aware route planning
- Landfill selection based on material acceptance
- Detour coefficient for route optimization
- Support for multiple stop types (pickup, drop, exchange, service, dump)

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "dependencies": {
    "@cortiware/routing": "file:../../packages/routing"
  }
}
```

## API Reference

### Types

```typescript
type Point = { 
  lat: number; 
  lon: number; 
};

type Landfill = { 
  id: string; 
  name: string; 
  point: Point; 
  accepts: string[]; // material types accepted
};

type Stop = { 
  id: string; 
  kind: "drop" | "pickup" | "exchange" | "service" | "dump"; 
  point: Point; 
  assetType?: "rolloff" | "port-a-john"; 
  size?: string; 
  material?: string; 
  preferredLandfillId?: string; 
};

type RoutePlan = { 
  date: string; 
  driverId: string; 
  yard: Point; // starting point
  capacity: number; // vehicle capacity
  stops: Stop[]; 
};

type RoutingOptions = {
  detourCoefficient?: number; // multiplier for detour penalty (default 1.0)
  maxStops?: number; // max stops per route (default unlimited)
};
```

### Functions

#### `chooseLandfill(stop: Stop, landfills: Landfill[], route: RoutePlan): Landfill | null`

Selects the best landfill for a given stop based on:
1. Material acceptance (filters landfills that accept the material)
2. Preferred landfill ID (if specified)
3. Distance from stop (closest landfill)

```typescript
import { chooseLandfill } from '@cortiware/routing';

const landfills = [
  { id: 'lf1', name: 'City Landfill', point: { lat: 40.7, lon: -74.0 }, accepts: ['waste', 'recycling'] },
  { id: 'lf2', name: 'County Dump', point: { lat: 40.8, lon: -74.1 }, accepts: ['waste'] }
];

const stop = {
  id: 'stop1',
  kind: 'pickup',
  point: { lat: 40.75, lon: -74.05 },
  material: 'waste'
};

const landfill = chooseLandfill(stop, landfills, routePlan);
```

#### `planSimple(route: RoutePlan, landfills: Landfill[], options?: RoutingOptions): RoutePlan`

Plans a route using a simple greedy algorithm:
1. Starts from yard location
2. Selects nearest unvisited stop
3. Tracks vehicle capacity
4. Inserts dump stops when capacity is reached
5. Returns optimized route plan

```typescript
import { planSimple } from '@cortiware/routing';

const route = {
  date: '2025-10-12',
  driverId: 'driver-123',
  yard: { lat: 40.7, lon: -74.0 },
  capacity: 5,
  stops: [
    { id: 's1', kind: 'pickup', point: { lat: 40.71, lon: -74.01 } },
    { id: 's2', kind: 'drop', point: { lat: 40.72, lon: -74.02 } },
    { id: 's3', kind: 'pickup', point: { lat: 40.73, lon: -74.03 } }
  ]
};

const optimized = planSimple(route, landfills, {
  detourCoefficient: 1.2,
  maxStops: 10
});
```

## Usage Examples

### Basic Route Planning

```typescript
import { planSimple } from '@cortiware/routing';

const landfills = [
  { 
    id: 'lf1', 
    name: 'Main Landfill', 
    point: { lat: 40.8, lon: -74.1 }, 
    accepts: ['waste', 'recycling', 'construction'] 
  }
];

const route = {
  date: '2025-10-12',
  driverId: 'driver-001',
  yard: { lat: 40.7, lon: -74.0 },
  capacity: 3,
  stops: [
    { id: 's1', kind: 'pickup', point: { lat: 40.71, lon: -74.01 }, material: 'waste' },
    { id: 's2', kind: 'pickup', point: { lat: 40.72, lon: -74.02 }, material: 'waste' },
    { id: 's3', kind: 'pickup', point: { lat: 40.73, lon: -74.03 }, material: 'waste' },
    { id: 's4', kind: 'drop', point: { lat: 40.74, lon: -74.04 } }
  ]
};

const optimized = planSimple(route, landfills);

console.log('Optimized route:', optimized.stops.map(s => s.id));
// Output: ['s1', 's2', 's3', 'dump-...', 's4']
```

### Route with Capacity Management

```typescript
import { planSimple } from '@cortiware/routing';

// Vehicle can hold 2 items before needing to dump
const route = {
  date: '2025-10-12',
  driverId: 'driver-002',
  yard: { lat: 40.7, lon: -74.0 },
  capacity: 2,
  stops: [
    { id: 'p1', kind: 'pickup', point: { lat: 40.71, lon: -74.01 } },
    { id: 'p2', kind: 'pickup', point: { lat: 40.72, lon: -74.02 } },
    { id: 'p3', kind: 'pickup', point: { lat: 40.73, lon: -74.03 } }
  ]
};

const optimized = planSimple(route, landfills);

// Route will automatically insert dump stops:
// p1 -> p2 -> dump -> p3
```

### Preferred Landfill Selection

```typescript
import { chooseLandfill } from '@cortiware/routing';

const stop = {
  id: 's1',
  kind: 'pickup',
  point: { lat: 40.75, lon: -74.05 },
  material: 'construction',
  preferredLandfillId: 'lf2' // prefer specific landfill
};

const landfills = [
  { id: 'lf1', name: 'Landfill A', point: { lat: 40.7, lon: -74.0 }, accepts: ['construction'] },
  { id: 'lf2', name: 'Landfill B', point: { lat: 40.8, lon: -74.1 }, accepts: ['construction'] }
];

const selected = chooseLandfill(stop, landfills, route);
// Returns lf2 (preferred) even if lf1 is closer
```

### Custom Routing Options

```typescript
import { planSimple } from '@cortiware/routing';

const optimized = planSimple(route, landfills, {
  detourCoefficient: 1.5, // penalize detours more heavily
  maxStops: 8 // limit route to 8 stops
});
```

## Algorithm Details

### Simple Greedy Algorithm

The `planSimple` function uses a greedy nearest-neighbor approach:

1. **Start at yard**: Begin route from yard location
2. **Select nearest stop**: Choose unvisited stop closest to current location
3. **Track capacity**: Decrement capacity for pickups/exchanges
4. **Insert dumps**: When capacity reaches 0, insert dump stop at nearest landfill
5. **Repeat**: Continue until all stops are visited or maxStops reached

### Distance Calculation

Uses Euclidean distance for simplicity:
```typescript
distance = sqrt((lat1 - lat2)² + (lon1 - lon2)²)
```

For production use with real coordinates, consider using Haversine formula or actual road distances.

### Capacity Management

- **Pickup**: Decreases available capacity by 1
- **Exchange**: Decreases available capacity by 1 (drop old, pick up new)
- **Drop**: No capacity change
- **Service**: No capacity change
- **Dump**: Resets capacity to maximum

## Limitations

1. **Simple greedy algorithm**: Not optimal for complex routes (consider TSP solvers for optimization)
2. **Euclidean distance**: Doesn't account for actual road distances
3. **No time windows**: Doesn't consider customer time preferences
4. **No traffic**: Doesn't account for traffic patterns
5. **Single vehicle**: Plans one route at a time

## Future Enhancements

- Genetic algorithm for better optimization
- Time window constraints
- Multiple vehicle routing
- Real-time traffic integration
- Road distance calculation (Google Maps API, OSRM)
- Route balancing across drivers

## Related Packages

- `@cortiware/verticals`: Vertical-specific business logic
- `@cortiware/agreements`: Service agreements

## Documentation

- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

