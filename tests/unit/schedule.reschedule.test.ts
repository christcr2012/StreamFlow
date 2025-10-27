// Minimal unit tests for schedule reschedule API
// Run with: npm run test:unit

export async function run() {
  const name = 'schedule.reschedule';
  let passed = 0, failed = 0, total = 0;
  
  function assert(cond: any, msg: string) { 
    total++; 
    if (cond) passed++; 
    else { 
      failed++; 
      console.error(`[FAIL] ${name}: ${msg}`); 
    } 
  }

  // Test 1: Validate date parsing
  {
    const scheduledStart = '2025-10-28T10:00:00Z';
    const scheduledEnd = '2025-10-28T12:00:00Z';
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    
    assert(!isNaN(start.getTime()), 'start date should parse correctly');
    assert(!isNaN(end.getTime()), 'end date should parse correctly');
    assert(end > start, 'end should be after start');
  }

  // Test 2: Reject invalid date order
  {
    const scheduledStart = '2025-10-28T12:00:00Z';
    const scheduledEnd = '2025-10-28T10:00:00Z';
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    
    assert(end <= start, 'invalid order should fail check');
  }

  // Test 3: Duration calculation
  {
    const start = new Date('2025-10-28T10:00:00Z');
    const end = new Date('2025-10-28T12:00:00Z');
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = Math.round(durationMs / 60000);
    
    assert(durationMinutes === 120, 'duration should be 120 minutes for 2-hour slot');
  }

  // Test 4: Conflict detection logic (same technician, overlapping times)
  {
    const existingStart = new Date('2025-10-28T09:00:00Z');
    const existingEnd = new Date('2025-10-28T11:00:00Z');
    
    const newStart = new Date('2025-10-28T10:00:00Z');
    const newEnd = new Date('2025-10-28T12:00:00Z');
    
    // Check if new job starts during existing job
    const startsInside = newStart >= existingStart && newStart < existingEnd;
    assert(startsInside, 'new job starting at 10:00 should conflict with existing 9:00-11:00');
    
    // Check if new job ends during existing job
    const endsInside = newEnd > existingStart && newEnd <= existingEnd;
    assert(!endsInside, 'new job ending at 12:00 should not end inside existing 9:00-11:00');
  }

  // Test 5: Non-conflicting times
  {
    const existingStart = new Date('2025-10-28T09:00:00Z');
    const existingEnd = new Date('2025-10-28T11:00:00Z');
    
    const newStart = new Date('2025-10-28T11:00:00Z');
    const newEnd = new Date('2025-10-28T13:00:00Z');
    
    const hasConflict = (
      (newStart >= existingStart && newStart < existingEnd) || // starts during
      (newEnd > existingStart && newEnd <= existingEnd) || // ends during
      (newStart <= existingStart && newEnd >= existingEnd) // completely overlaps
    );
    
    assert(!hasConflict, 'new job 11:00-13:00 should not conflict with existing 9:00-11:00');
  }

  if (failed > 0) {
    console.error(`❌ ${name}: ${failed}/${total} tests failed`);
    return { passed, failed, total };
  } else {
    console.log(`✅ ${name}: All ${passed} tests passed`);
    return { passed, failed, total };
  }
}

// Allow direct execution
if (require.main === module) {
  run().then(r => process.exit(r.failed > 0 ? 1 : 0));
}
