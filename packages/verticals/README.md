# @cortiware/verticals

Industry-specific business logic and pricing for service verticals.

## Overview

This package provides vertical-specific packs for different service industries. Each pack includes:
- Form schemas for data collection
- Price books with SKUs and rates
- Estimation logic for quotes
- Industry-specific business rules

Supported verticals (18 total):
- **Waste Management**: Rolloff, Port-a-John
- **Home Services**: Cleaning, HVAC, Plumbing, Electrical, Painting, Pest Control
- **Outdoor Services**: Landscaping, Pressure Washing, Snow Removal, Fencing
- **Specialty**: Roofing, Concrete Lifting & Leveling, Appliance Rental, Auto Detail
- **Generic**: Service, Rental, Project

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "dependencies": {
    "@cortiware/verticals": "file:../../packages/verticals"
  }
}
```

## API Reference

### Types

```typescript
type EstimateResult = {
  total: number;
  lines: Array<{ 
    sku: string; 
    qty: number; 
    unit?: number; 
    total?: number 
  }>;
  warnings: string[];
};

interface VerticalPack {
  key: string;
  getForm(formKey: string, orgId: string): any; // JSON Schema
  getPriceBook(orgId: string): any; // Array or object with SKUs
  estimate(inputs: Record<string, any>): EstimateResult;
}
```

### Registry

```typescript
import { verticalsRegistry } from '@cortiware/verticals';

// Access specific vertical
const cleaningPack = verticalsRegistry['cleaning'];
const rolloffPack = verticalsRegistry['roll-off'];
```

### Helper Functions

```typescript
import { getForm, getPriceBook, estimate } from '@cortiware/verticals';

// Get form schema
const form = getForm('cleaning', 'quote-form', 'org-123');

// Get price book
const prices = getPriceBook('cleaning', 'org-123');

// Generate estimate
const result = estimate('cleaning', {
  serviceType: 'residential',
  squareFeet: 2000
});
```

## Available Verticals

### Waste Management

#### Rolloff (`roll-off`)
Dumpster rental and waste removal.

```typescript
import { estimate } from '@cortiware/verticals';

const result = estimate('roll-off', {
  size: '20-yard',
  duration: 7,
  material: 'construction'
});
```

#### Port-a-John (`port-a-john`)
Portable restroom rental.

```typescript
const result = estimate('port-a-john', {
  units: 5,
  duration: 30,
  serviceFrequency: 'weekly'
});
```

### Home Services

#### Cleaning (`cleaning`)
Residential and commercial cleaning.

```typescript
const result = estimate('cleaning', {
  serviceType: 'residential',
  squareFeet: 2000
});
```

#### HVAC (`hvac`)
Heating, ventilation, and air conditioning.

```typescript
const result = estimate('hvac', {
  serviceType: 'installation',
  systemType: 'central-air',
  squareFeet: 2500
});
```

#### Plumbing (`plumbing`)
Plumbing services and repairs.

```typescript
const result = estimate('plumbing', {
  serviceType: 'repair',
  fixtures: 3
});
```

#### Electrical (`electrical`)
Electrical services and installations.

```typescript
const result = estimate('electrical', {
  serviceType: 'panel-upgrade',
  amps: 200
});
```

#### Painting (`painting`)
Interior and exterior painting.

```typescript
const result = estimate('painting', {
  type: 'interior',
  squareFeet: 1500,
  coats: 2
});
```

#### Pest Control (`pest-control`)
Pest management and extermination.

```typescript
const result = estimate('pest-control', {
  serviceType: 'monthly',
  squareFeet: 2000,
  pestType: 'general'
});
```

### Outdoor Services

#### Landscaping (`landscaping`)
Lawn care and landscaping.

```typescript
const result = estimate('landscaping', {
  serviceType: 'mowing',
  squareFeet: 5000,
  frequency: 'weekly'
});
```

#### Pressure Washing (`pressure-washing`)
Exterior cleaning services.

```typescript
const result = estimate('pressure-washing', {
  surface: 'driveway',
  squareFeet: 500
});
```

#### Snow Removal (`snow-removal`)
Snow plowing and removal.

```typescript
const result = estimate('snow-removal', {
  serviceType: 'seasonal',
  squareFeet: 10000
});
```

#### Fencing (`fencing`)
Fence installation and repair.

```typescript
const result = estimate('fencing', {
  type: 'wood',
  linearFeet: 100,
  height: 6
});
```

### Specialty Services

#### Roofing (`roofing`)
Roof installation and repair.

```typescript
const result = estimate('roofing', {
  serviceType: 'replacement',
  squareFeet: 2000,
  material: 'asphalt-shingle'
});
```

#### Concrete Lifting & Leveling (`concrete-lifting-and-leveling`)
Concrete repair and leveling.

```typescript
const result = estimate('concrete-lifting-and-leveling', {
  squareFeet: 200,
  severity: 'moderate'
});
```

#### Appliance Rental (`appliance-rental`)
Equipment and appliance rental.

```typescript
const result = estimate('appliance-rental', {
  type: 'washer-dryer',
  duration: 30
});
```

#### Auto Detail (`auto-detail`)
Vehicle detailing services.

```typescript
const result = estimate('auto-detail', {
  vehicleType: 'sedan',
  serviceLevel: 'premium'
});
```

### Generic Verticals

#### Generic Service (`generic-service`)
Flexible service-based pricing.

```typescript
const result = estimate('generic-service', {
  hours: 4,
  rate: 75
});
```

#### Generic Rental (`generic-rental`)
Flexible rental pricing.

```typescript
const result = estimate('generic-rental', {
  units: 2,
  duration: 7,
  dailyRate: 50
});
```

#### Generic Project (`generic-project`)
Flexible project-based pricing.

```typescript
const result = estimate('generic-project', {
  laborHours: 40,
  materialsCost: 5000
});
```

## Usage Examples

### Get Form Schema

```typescript
import { getForm } from '@cortiware/verticals';

const form = getForm('cleaning', 'quote-form', 'org-123');

console.log(form);
// {
//   title: 'Cleaning Service',
//   type: 'object',
//   properties: {
//     serviceType: { type: 'string', enum: [...] },
//     squareFeet: { type: 'number', minimum: 0 }
//   },
//   required: ['serviceType', 'squareFeet']
// }
```

### Get Price Book

```typescript
import { getPriceBook } from '@cortiware/verticals';

const prices = getPriceBook('cleaning', 'org-123');

console.log(prices);
// [
//   { sku: 'CLEAN-RES', description: 'Residential Cleaning', unit: 100, price: 50 },
//   { sku: 'CLEAN-COM', description: 'Commercial Cleaning', unit: 100, price: 75 }
// ]
```

### Generate Estimate

```typescript
import { estimate } from '@cortiware/verticals';

const result = estimate('cleaning', {
  serviceType: 'residential',
  squareFeet: 2000
});

console.log(result);
// {
//   total: 1000,
//   lines: [
//     { sku: 'CLEAN-RESIDENTIAL', qty: 2000, unit: 0.50, total: 1000 }
//   ],
//   warnings: []
// }
```

### Handle Warnings

```typescript
import { estimate } from '@cortiware/verticals';

const result = estimate('rolloff', {
  size: '40-yard',
  duration: 90 // unusually long
});

if (result.warnings.length > 0) {
  console.log('Warnings:', result.warnings);
  // ['Duration exceeds typical rental period']
}
```

### Multi-Line Estimates

```typescript
import { estimate } from '@cortiware/verticals';

const result = estimate('hvac', {
  serviceType: 'installation',
  systemType: 'central-air',
  squareFeet: 2500,
  includeLabor: true,
  includeMaterials: true
});

console.log(result.lines);
// [
//   { sku: 'HVAC-LABOR', qty: 16, unit: 125, total: 2000 },
//   { sku: 'HVAC-MATERIALS', qty: 1, unit: 5000, total: 5000 }
// ]
// Total: 7000
```

## Extending Verticals

To add a new vertical pack:

1. Create a new file in `packages/verticals/src/packs/my-vertical.ts`
2. Implement the `VerticalPack` interface
3. Export the pack
4. Register in `packages/verticals/src/index.ts`

```typescript
// packages/verticals/src/packs/my-vertical.ts
import type { VerticalPack, EstimateResult } from '../index';

export const pack: VerticalPack = {
  key: 'my-vertical',
  
  getForm: (formKey: string, orgId: string) => ({
    title: 'My Service',
    type: 'object',
    properties: {
      // Define form fields
    },
    required: []
  }),
  
  getPriceBook: (orgId: string) => [
    { sku: 'MY-SKU', description: 'My Service', unit: 1, price: 100 }
  ],
  
  estimate: (inputs: Record<string, any>): EstimateResult => {
    // Calculate estimate
    return {
      total: 0,
      lines: [],
      warnings: []
    };
  }
};
```

```typescript
// packages/verticals/src/index.ts
import * as myVertical from './packs/my-vertical';

export const verticalsRegistry: Record<string, VerticalPack> = {
  // ... existing verticals
  'my-vertical': myVertical.pack,
};
```

## Best Practices

1. **Use JSON Schema** for form definitions (enables validation)
2. **Include warnings** for unusual inputs or edge cases
3. **Provide clear SKUs** that identify the service/product
4. **Support org-specific pricing** via orgId parameter
5. **Document units** clearly (per sqft, per hour, per unit, etc.)

## Related Packages

- `@cortiware/agreements`: Rule evaluation for billing
- `@cortiware/routing`: Route planning for service businesses

## Documentation

- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

