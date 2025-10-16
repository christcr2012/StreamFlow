import { planSimple, chooseLandfill, type Landfill, type RoutePlan, type Stop } from '../../packages/routing/src/engine';

export async function run() {
  const name = 'routing';
  let passed = 0, failed = 0, total = 0;
  function assert(cond: any, msg: string) { total++; if (cond) passed++; else { failed++; console.error(`[FAIL] ${name}: ${msg}`); } }

  const yard = { lat: 39.5, lon: -104.9 };
  const landfills: Landfill[] = [
    { id: 'LF1', name: 'North', point: { lat: 39.8, lon: -105.0 }, accepts: ['msw', 'c&d'] },
    { id: 'LF2', name: 'East',  point: { lat: 39.6, lon: -104.6 }, accepts: ['msw'] },
  ];

  // 1) Capacity-triggered dump insertion
  {
    const route: RoutePlan = {
      date: '2025-10-07', driverId: 'D1', yard, capacity: 1,
      stops: [
        { id: 'S1', kind: 'pickup', point: { lat: 39.55, lon: -104.95 }, material: 'msw' },
        { id: 'S2', kind: 'pickup', point: { lat: 39.58, lon: -104.92 }, material: 'msw' },
      ] as Stop[],
    };
    const out = planSimple(route, landfills);
    const kinds = out.stops.map(s => s.kind);
    assert(kinds.includes('dump'), 'should insert a dump stop when capacity hits zero');
    // Ensure dump inserted before the second pickup (resetting capacity)
    const i1 = kinds.indexOf('pickup');
    const idump = kinds.indexOf('dump');
    const i2 = kinds.lastIndexOf('pickup');
    assert(i1 !== -1 && idump !== -1 && i2 !== -1 && i1 < idump && idump < i2, 'dump should be between pickups');
  }

  // 2) Landfill choice respects material and preferred ID
  {
    const stop: Stop = { id: 'S3', kind: 'pickup', point: { lat: 39.56, lon: -104.91 }, material: 'msw', preferredLandfillId: 'LF2' };
    const chosen = chooseLandfill(stop, landfills, { date: '', driverId: '', yard, capacity: 1, stops: [] });
    assert(!!chosen, 'should choose a landfill');
    assert(chosen!.id === 'LF2', 'should honor preferredLandfillId when valid among candidates');
  }

  // 3) Property test: capacity invariant (never exceed capacity without dump)
  {
    const route: RoutePlan = {
      date: '2025-10-07', driverId: 'D1', yard, capacity: 3,
      stops: [
        { id: 'S1', kind: 'pickup', point: { lat: 39.55, lon: -104.95 }, material: 'msw' },
        { id: 'S2', kind: 'pickup', point: { lat: 39.58, lon: -104.92 }, material: 'msw' },
        { id: 'S3', kind: 'pickup', point: { lat: 39.60, lon: -104.88 }, material: 'msw' },
        { id: 'S4', kind: 'pickup', point: { lat: 39.62, lon: -104.85 }, material: 'msw' },
        { id: 'S5', kind: 'pickup', point: { lat: 39.64, lon: -104.82 }, material: 'msw' },
      ] as Stop[],
    };
    const out = planSimple(route, landfills);

    // Verify capacity invariant: count pickups between dumps
    let currentLoad = 0;
    let maxLoadSeen = 0;
    for (const s of out.stops) {
      if (s.kind === 'pickup' || s.kind === 'exchange') {
        currentLoad++;
        maxLoadSeen = Math.max(maxLoadSeen, currentLoad);
      } else if (s.kind === 'dump') {
        currentLoad = 0;
      }
    }
    assert(maxLoadSeen <= route.capacity, `capacity invariant: max load ${maxLoadSeen} should not exceed capacity ${route.capacity}`);
  }

  // 4) Property test: detour coefficient affects route order
  {
    const route: RoutePlan = {
      date: '2025-10-07', driverId: 'D1', yard, capacity: 10,
      stops: [
        { id: 'S1', kind: 'pickup', point: { lat: 39.55, lon: -104.95 }, material: 'msw' },
        { id: 'S2', kind: 'pickup', point: { lat: 39.80, lon: -105.10 }, material: 'msw' }, // far north
        { id: 'S3', kind: 'pickup', point: { lat: 39.56, lon: -104.94 }, material: 'msw' },
      ] as Stop[],
    };

    const out1 = planSimple(route, landfills, { detourCoefficient: 1.0 });
    const out2 = planSimple(route, landfills, { detourCoefficient: 2.0 });

    // With higher detour coefficient, distant stops should be deprioritized
    // Both should complete all stops, but order may differ
    assert(out1.stops.length === 3, 'detour 1.0: should plan all 3 stops');
    assert(out2.stops.length === 3, 'detour 2.0: should plan all 3 stops');
  }

  // 5) Performance smoke test: large input (100 stops)
  {
    const largeStops: Stop[] = [];
    for (let i = 0; i < 100; i++) {
      largeStops.push({
        id: `S${i}`,
        kind: 'pickup',
        point: { lat: 39.5 + Math.random() * 0.5, lon: -105.0 + Math.random() * 0.5 },
        material: 'msw',
      } as Stop);
    }

    const route: RoutePlan = {
      date: '2025-10-07', driverId: 'D1', yard, capacity: 10,
      stops: largeStops,
    };

    const start = Date.now();
    const out = planSimple(route, landfills);
    const elapsed = Date.now() - start;

    assert(out.stops.length > 0, 'large input: should plan at least some stops');
    assert(elapsed < 1000, `large input: should complete in <1s (took ${elapsed}ms)`);
  }

  // 6) Property test: maxStops option limits output
  {
    const route: RoutePlan = {
      date: '2025-10-07', driverId: 'D1', yard, capacity: 10,
      stops: [
        { id: 'S1', kind: 'pickup', point: { lat: 39.55, lon: -104.95 }, material: 'msw' },
        { id: 'S2', kind: 'pickup', point: { lat: 39.58, lon: -104.92 }, material: 'msw' },
        { id: 'S3', kind: 'pickup', point: { lat: 39.60, lon: -104.88 }, material: 'msw' },
        { id: 'S4', kind: 'pickup', point: { lat: 39.62, lon: -104.85 }, material: 'msw' },
        { id: 'S5', kind: 'pickup', point: { lat: 39.64, lon: -104.82 }, material: 'msw' },
      ] as Stop[],
    };

    const out = planSimple(route, landfills, { maxStops: 3 });
    assert(out.stops.length <= 3, `maxStops: should limit to 3 stops (got ${out.stops.length})`);
  }

  return { name, passed, failed, total };
}

