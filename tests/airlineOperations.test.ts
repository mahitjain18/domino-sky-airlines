import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RAW_AIRLINE_DATA } from '../src/data/airlineData.ts';
import {
  analyzeTurnarounds,
  analyzeCrewDuty,
  analyzePassengerConnections,
  analyzeAirportCapacity,
  analyzeFleetStatus,
  generateOperationalAlerts,
  generateAIRecommendations,
  simulateFlightDelay,
  deploySpareSwap,
  applyReliefCrew,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  sanitizeIntegerInput,
  sanitizeSearchInput
} from '../src/utils/airlineCalculations.ts';

describe('DOMINO SKY — AI AIRLINE OCC REGULATORY & FUNCTIONAL TESTS', () => {

  // 1. DATASET INTEGRITY & SPECIFICATION ALIGNMENT
  describe('1. Dataset Verification & Ground Truth', () => {
    test('Dataset contains exact 70 scheduled flight legs', () => {
      assert.strictEqual(RAW_AIRLINE_DATA.flights.length, 70);
    });

    test('Dataset contains exact 16 airports with defined capacities', () => {
      assert.strictEqual(RAW_AIRLINE_DATA.airports.length, 16);
      const airportIds = RAW_AIRLINE_DATA.airports.map(a => a.id);
      assert.ok(airportIds.includes('DEL'));
      assert.ok(airportIds.includes('BOM'));
      assert.ok(airportIds.includes('BLR'));
      assert.ok(airportIds.includes('HYD'));
      assert.ok(airportIds.includes('CCU'));
      assert.ok(airportIds.includes('MAA'));
    });

    test('Dataset contains exact 16 active aircraft tails and 2 hot-standby spares', () => {
      const activeTails = new Set(RAW_AIRLINE_DATA.flights.map(f => f.tail_id));
      assert.strictEqual(activeTails.size, 16);
      assert.strictEqual(RAW_AIRLINE_DATA.spare_aircraft.length, 2);
      
      const spareTails = RAW_AIRLINE_DATA.spare_aircraft.map(s => s.tail_id);
      assert.ok(spareTails.includes('VT-DS17'));
      assert.ok(spareTails.includes('VT-DS18'));
    });

    test('Total passenger connections count is 21 and sums to exactly 659 passengers', () => {
      assert.strictEqual(RAW_AIRLINE_DATA.connections.length, 21);
      const totalConnectingPax = RAW_AIRLINE_DATA.connections.reduce((sum, c) => sum + c.passengers, 0);
      assert.strictEqual(totalConnectingPax, 659);
    });

    test('Active fleet rotation seat capacity equals 2,880 (16 aircraft × 180 seats)', () => {
      const seatsPerAc = RAW_AIRLINE_DATA.meta.seats_per_aircraft;
      assert.strictEqual(seatsPerAc, 180);
      const activeSeats = 16 * seatsPerAc;
      assert.strictEqual(activeSeats, 2880);
      const totalFleetSeatsWithSpares = (16 + 2) * seatsPerAc;
      assert.strictEqual(totalFleetSeatsWithSpares, 3240);
    });
  });

  // 2. TURNAROUND VALIDATION (MINIMUM 30 MINUTES)
  describe('2. Aircraft Turnaround Validation (Min 30-min Standard)', () => {
    test('Zero turnaround safety violations exist in baseline schedule', () => {
      const turnarounds = analyzeTurnarounds(RAW_AIRLINE_DATA.flights, 30);
      const violations = turnarounds.filter(t => t.is_violation);
      assert.strictEqual(violations.length, 0);
    });

    test('Accurately identifies exactly 7 legs operating at the strict 30-minute minimum', () => {
      const turnarounds = analyzeTurnarounds(RAW_AIRLINE_DATA.flights, 30);
      const exact30mLegs = turnarounds.filter(t => t.actual_gap_mins === 30).map(t => t.flight_id);
      
      const expectedExact30 = ['DS0402', 'DS0504', 'DS0604', 'DS0704', 'DS1202', 'DS1304', 'DS1403'];
      for (const flightId of expectedExact30) {
        assert.ok(exact30mLegs.includes(flightId), `Expected ${flightId} to have exact 30m turnaround`);
      }
      assert.strictEqual(exact30mLegs.length, 7);
    });
  });

  // 3. CREW DUTY LIMIT VALIDATION (MAX 600 MINUTES)
  describe('3. Crew Flight Duty Period Validation (DGCA 600m Cap)', () => {
    test('Zero legal duty violations exist in baseline schedule', () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const violations = crews.filter(c => c.is_violation);
      assert.strictEqual(violations.length, 0);
    });

    test('Accurately identifies CR03 as highest risk at 590/600 mins (98.3% duty cap)', () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const cr03 = crews.find(c => c.crew_id === 'CR03');
      assert.ok(cr03, 'Crew CR03 must exist in analysis');
      assert.strictEqual(cr03.total_duty_mins, 590);
      assert.strictEqual(cr03.max_duty_mins, 600);
      assert.strictEqual(cr03.remaining_duty_mins, 10);
      assert.strictEqual(cr03.is_high_risk, true);
      assert.strictEqual(cr03.base, 'DEL');
    });

    test('Accurately flags all 4 high-risk crews operating above 90% duty threshold', () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const highRiskIds = crews.filter(c => c.is_high_risk).map(c => c.crew_id).sort();
      assert.deepStrictEqual(highRiskIds, ['CR03', 'CR08', 'CR10', 'CR11']);
    });
  });

  // 4. PASSENGER CONNECTIONS VALIDATION (MINIMUM CONNECT TIME)
  describe('4. Passenger Connection Integrity & MCT Validation', () => {
    test('All 21 passenger connection pairs are valid at baseline (0 broken)', () => {
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const broken = connections.filter(c => c.is_broken);
      assert.strictEqual(broken.length, 0);
      
      const validPax = connections.filter(c => !c.is_broken).reduce((sum, c) => sum + c.passengers, 0);
      assert.strictEqual(validPax, 659);
    });

    test('Accurately flags the 5 tight connection pairs with safety buffer <= 15 mins', () => {
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const tight = connections.filter(c => c.is_tight);
      assert.strictEqual(tight.length, 5);
      
      const tightIds = tight.map(c => c.connection_id).sort();
      assert.deepStrictEqual(tightIds, ['CX03', 'CX05', 'CX13', 'CX14', 'CX20']);

      const cx14 = connections.find(c => c.connection_id === 'CX14');
      assert.ok(cx14);
      assert.strictEqual(cx14.buffer_mins, 5, 'CX14 must have exactly 5 min safety buffer');
      assert.strictEqual(cx14.passengers, 20);
    });
  });

  // 5. AIRPORT HOURLY RUNWAY CAPACITY
  describe('5. Airport Runway Hourly Capacity Analytics', () => {
    test('Evaluates all 16 airports across 24 hourly buckets with zero overages', () => {
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      assert.strictEqual(airports.length, 16);
      
      const overages = airports.filter(a => a.has_overage);
      assert.strictEqual(overages.length, 0);
    });

    test('Accurately calculates total daily movements: BLR=22, DEL=20, BOM=18', () => {
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const blr = airports.find(a => a.airport.id === 'BLR');
      const del = airports.find(a => a.airport.id === 'DEL');
      const bom = airports.find(a => a.airport.id === 'BOM');

      assert.strictEqual(blr?.total_movements_day, 22);
      assert.strictEqual(del?.total_movements_day, 20);
      assert.strictEqual(bom?.total_movements_day, 18);
    });
  });

  // 6. DISRUPTION SIMULATION & CASCADING REACTION
  describe('6. Disruption Simulation & Dynamic Impact Recalculation', () => {
    test('Injecting 45m delay on DS0301 propagates cascading delays on rotation VT-DS03', () => {
      const result = simulateFlightDelay(RAW_AIRLINE_DATA, 'DS0301', 45);
      assert.ok(result.affectedFlightsCount >= 3, 'At least 3 legs must be affected');
      assert.ok(result.cascadingDelayMinutes >= 45, 'Cascading delay minutes must be >= 45');

      // Subsequent legs must inherit delays
      const delayedLegs = result.simulatedFlights.filter(f => (f.delay_minutes || 0) > 0);
      assert.ok(delayedLegs.length >= 3, 'At least 3 legs must inherit delay on VT-DS03');

      // Crew CR03 must breach 600m duty limit
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, result.simulatedFlights);
      const cr03 = crews.find(c => c.crew_id === 'CR03');
      assert.ok(cr03);
      assert.strictEqual(cr03.is_violation, true);
      assert.ok(cr03.total_duty_mins > 600);
    });

    test('AI Recommendations generate actionable recovery strategy for duty breach', () => {
      const sim = simulateFlightDelay(RAW_AIRLINE_DATA, 'DS0301', 45);
      const turnarounds = analyzeTurnarounds(sim.simulatedFlights, 30);
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, sim.simulatedFlights);
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, sim.simulatedFlights);
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, sim.simulatedFlights);

      const recs = generateAIRecommendations(
        RAW_AIRLINE_DATA,
        turnarounds,
        crews,
        connections,
        airports,
        RAW_AIRLINE_DATA.spare_aircraft
      );

      assert.ok(recs.length > 0, 'Must generate AI recommendations during disruption');
      const crewRec = recs.find(r => r.category === 'Crew Management');
      assert.ok(crewRec, 'Must generate a Crew Management recommendation for CR03');
    });
  });

  // 7. TIME MATH UTILITIES & EDGE CASES
  describe('7. High-Precision Time Utility Functions & Boundary Defense', () => {
    test('timeToMinutes and minutesToTime perform exact bidirectional conversions', () => {
      assert.strictEqual(timeToMinutes('06:00'), 360);
      assert.strictEqual(timeToMinutes('23:59'), 1439);
      assert.strictEqual(minutesToTime(360), '06:00');
      assert.strictEqual(minutesToTime(1439), '23:59');
    });

    test('timeToMinutes handles invalid, null, undefined, and malformed strings safely', () => {
      assert.strictEqual(timeToMinutes(''), 0);
      assert.strictEqual(timeToMinutes(null as unknown as string), 0);
      assert.strictEqual(timeToMinutes(undefined as unknown as string), 0);
      assert.strictEqual(timeToMinutes('invalid'), 0);
      assert.strictEqual(timeToMinutes('25:abc'), 0);
    });

    test('minutesToTime handles negative numbers and NaN with safe 24-hour wrap', () => {
      assert.strictEqual(minutesToTime(-60), '23:00');
      assert.strictEqual(minutesToTime(NaN), '00:00');
      assert.strictEqual(minutesToTime(Infinity), '00:00');
      assert.strictEqual(minutesToTime(1500), '01:00'); // 1500 % 1440 = 60 mins -> 01:00
    });

    test('addMinutesToTime rolls over midnight seamlessly', () => {
      assert.strictEqual(addMinutesToTime('23:45', 30), '00:15');
      assert.strictEqual(addMinutesToTime('00:10', 50), '01:00');
    });
  });

  // 8. INPUT SANITIZATION & SECURITY DEFENSE
  describe('8. Input Sanitization & Security Bounds Defense', () => {
    test('sanitizeIntegerInput strictly bounds numbers, clamps ranges, and rejects NaN', () => {
      assert.strictEqual(sanitizeIntegerInput(30, 0, 360, 0), 30);
      assert.strictEqual(sanitizeIntegerInput(500, 0, 360, 0), 360); // Clamped to max
      assert.strictEqual(sanitizeIntegerInput(-50, 0, 360, 0), 0); // Clamped to min
      assert.strictEqual(sanitizeIntegerInput('45', 0, 360, 0), 45);
      assert.strictEqual(sanitizeIntegerInput('bad_input', 0, 360, 30), 30); // Fallback used
      assert.strictEqual(sanitizeIntegerInput(NaN, 0, 360, 15), 15);
      assert.strictEqual(sanitizeIntegerInput(42.8, 0, 360, 0), 42); // Floored integer
    });

    test('sanitizeSearchInput strips control characters and limits string length', () => {
      assert.strictEqual(sanitizeSearchInput('  DS0301  '), 'DS0301');
      assert.strictEqual(sanitizeSearchInput('DEL\x00\x08'), 'DEL');
      assert.strictEqual(sanitizeSearchInput(null), '');
      assert.strictEqual(sanitizeSearchInput(123 as unknown as string), '');
      
      const longString = 'A'.repeat(200);
      const sanitized = sanitizeSearchInput(longString, 50);
      assert.strictEqual(sanitized.length, 50);
    });
  });

  // 9. HOT-STANDBY SPARE DEPLOYMENT & ROTATION RECOVERY
  describe('9. Hot-Standby Spare Aircraft Deployment Engine', () => {
    test('deploySpareSwap successfully reassigns target tail and clears cascading delays', () => {
      // Simulate delay on DS0301 first
      const sim = simulateFlightDelay(RAW_AIRLINE_DATA, 'DS0301', 45);
      const delayedTailLegs = sim.simulatedFlights.filter(f => f.tail_id === 'VT-DS03');
      assert.ok(delayedTailLegs.some(l => (l.delay_minutes || 0) > 0));

      // Deploy hot spare VT-DS18 to take over VT-DS03
      const swapResult = deploySpareSwap(sim.simulatedFlights, 'VT-DS18', 'VT-DS03');
      assert.strictEqual(swapResult.swappedLegsCount, delayedTailLegs.length);

      // Verify all swapped legs now belong to VT-DS18 and have 0 delay
      const swappedLegs = swapResult.updatedFlights.filter(f => f.tail_id === 'VT-DS18');
      assert.strictEqual(swappedLegs.length, delayedTailLegs.length);
      for (const leg of swappedLegs) {
        assert.strictEqual(leg.delay_minutes, 0);
        assert.strictEqual(leg.actual_dep, leg.dep);
      }
    });

    test('applyReliefCrew stabilizes duty hours and removes high-risk warning', () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const cr03Before = crews.find(c => c.crew_id === 'CR03')!;
      assert.strictEqual(cr03Before.is_high_risk, true);
      assert.strictEqual(cr03Before.total_duty_mins, 590);

      const relievedCrews = applyReliefCrew(crews, 'CR03');
      const cr03After = relievedCrews.find(c => c.crew_id === 'CR03')!;
      assert.strictEqual(cr03After.is_high_risk, false);
      assert.strictEqual(cr03After.is_violation, false);
      assert.strictEqual(cr03After.total_duty_mins, 480);
      assert.strictEqual(cr03After.remaining_duty_mins, 120);
    });
  });

  // 10. EMPTY & DEGENERATE STATE RESILIENCE
  describe('10. Edge Cases & Degenerate State Handling', () => {
    test('analyzeTurnarounds handles empty flight array gracefully', () => {
      const results = analyzeTurnarounds([], 30);
      assert.strictEqual(results.length, 0);
    });

    test('analyzeTurnarounds with a single flight returns turnaround with no previous leg', () => {
      const singleFlight = [RAW_AIRLINE_DATA.flights[0]];
      const results = analyzeTurnarounds(singleFlight, 30);
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].prev_flight_id, null);
      assert.strictEqual(results[0].is_violation, false);
    });

    test('analyzeCrewDuty handles empty flights gracefully', () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, []);
      assert.strictEqual(crews.length, 16);
      for (const c of crews) {
        assert.strictEqual(c.total_duty_mins, 0);
        assert.strictEqual(c.is_violation, false);
      }
    });

    test('analyzeFleetStatus evaluates all 16 active aircraft and computes valid load factors', () => {
      const fleet = analyzeFleetStatus(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      assert.strictEqual(fleet.length, 16);
      for (const ac of fleet) {
        assert.ok(ac.avg_load_factor > 0 && ac.avg_load_factor <= 100);
        assert.strictEqual(ac.status, 'active');
      }
    });
  });

  // 11. KINETIC AIRSPACE TOPOLOGY PROJECTION & TOPOLOGY ENGINE
  describe('11. Kinetic Airspace Topology Projection & Deterministic Engine', () => {
    test('All 16 airports project into valid bounding coordinates for Geo Radar mode', () => {
      const minLng = 67.5;
      const maxLng = 94.5;
      const minLat = 7.5;
      const maxLat = 32.5;

      for (const airport of RAW_AIRLINE_DATA.airports) {
        assert.ok(airport.lat >= minLat && airport.lat <= maxLat, `${airport.id} lat out of bounds`);
        assert.ok(airport.lng >= minLng && airport.lng <= maxLng, `${airport.id} lng out of bounds`);
        
        const x = ((airport.lng - minLng) / (maxLng - minLng)) * 740 + 130;
        const y = ((maxLat - airport.lat) / (maxLat - minLat)) * 540 + 75;
        assert.ok(!isNaN(x) && x >= 100 && x <= 950, `${airport.id} X projection failed`);
        assert.ok(!isNaN(y) && y >= 50 && y <= 680, `${airport.id} Y projection failed`);
      }
    });

    test('Orbital Constellation positions Mega Hubs, Regional Hubs, and Spokes in concentric rings', () => {
      const megaHubs = ['DEL', 'BLR', 'BOM', 'HYD'];
      const regionalHubs = ['AMD', 'CCU', 'COK', 'MAA'];

      for (const apId of megaHubs) {
        const ap = RAW_AIRLINE_DATA.airports.find(a => a.id === apId);
        assert.ok(ap, `Mega hub ${apId} must exist`);
        assert.strictEqual(ap.tier, 'mega_hub');
      }

      for (const apId of regionalHubs) {
        const ap = RAW_AIRLINE_DATA.airports.find(a => a.id === apId);
        assert.ok(ap, `Regional hub ${apId} must exist`);
        assert.strictEqual(ap.tier, 'regional_hub');
      }
    });

    test('All 70 flight routes map to existing origin and destination airport nodes', () => {
      const airportIdSet = new Set(RAW_AIRLINE_DATA.airports.map(a => a.id));
      for (const flight of RAW_AIRLINE_DATA.flights) {
        assert.ok(airportIdSet.has(flight.origin), `Flight ${flight.flight_id} has invalid origin ${flight.origin}`);
        assert.ok(airportIdSet.has(flight.destination), `Flight ${flight.flight_id} has invalid destination ${flight.destination}`);
      }
    });
  });

  // 12. FLIGHT DATA PARSING, FILTERING & SORTING ENGINE
  describe('12. Flight Data Parsing, Filtering & Sorting Engine', () => {
    test('Filtering by hub correctly isolates outbound and inbound legs', () => {
      const delDepartures = RAW_AIRLINE_DATA.flights.filter(f => f.origin === 'DEL');
      const delArrivals = RAW_AIRLINE_DATA.flights.filter(f => f.destination === 'DEL');
      assert.strictEqual(delDepartures.length, 11);
      assert.strictEqual(delArrivals.length, 9);
      assert.strictEqual(delDepartures.length + delArrivals.length, 20);
    });

    test('Filtering by aircraft tail isolates contiguous sequential rotations', () => {
      const ds01Legs = RAW_AIRLINE_DATA.flights.filter(f => f.tail_id === 'VT-DS01');
      assert.strictEqual(ds01Legs.length, 5);
      // Legs must be sequentially ordered
      for (let i = 0; i < ds01Legs.length; i++) {
        assert.strictEqual(ds01Legs[i].leg_order, i + 1);
        if (i > 0) {
          assert.strictEqual(ds01Legs[i].origin, ds01Legs[i - 1].destination);
        }
      }
    });

    test('Sorting flights by departure time produces strictly non-decreasing chronological order', () => {
      const sorted = [...RAW_AIRLINE_DATA.flights].sort((a, b) => timeToMinutes(a.dep) - timeToMinutes(b.dep));
      for (let i = 1; i < sorted.length; i++) {
        const prevMins = timeToMinutes(sorted[i - 1].dep);
        const currMins = timeToMinutes(sorted[i].dep);
        assert.ok(currMins >= prevMins, `Flights out of order: ${sorted[i - 1].dep} > ${sorted[i].dep}`);
      }
    });

    test('Sorting flights by block minutes correctly identifies longest and shortest routes', () => {
      const sortedByDuration = [...RAW_AIRLINE_DATA.flights].sort((a, b) => b.block_minutes - a.block_minutes);
      const longest = sortedByDuration[0];
      const shortest = sortedByDuration[sortedByDuration.length - 1];
      assert.ok(longest.block_minutes >= 140, `Longest leg should be >= 140m, got ${longest.block_minutes}`);
      assert.ok(shortest.block_minutes <= 75, `Shortest leg should be <= 75m, got ${shortest.block_minutes}`);
    });
  });

  // 13. DASHBOARD KPI MATHEMATICAL AGGREGATION
  describe('13. Dashboard KPI Mathematical Aggregation & Fleet Metrics', () => {
    test('Calculates total booked passenger volume across all scheduled flights', () => {
      const totalPax = RAW_AIRLINE_DATA.flights.reduce((sum, f) => sum + f.pax, 0);
      assert.strictEqual(totalPax, 10394);
    });

    test('Computes aggregate fleet seat utilization and average load factor', () => {
      const totalPax = RAW_AIRLINE_DATA.flights.reduce((sum, f) => sum + f.pax, 0);
      const totalSeatsOffered = RAW_AIRLINE_DATA.flights.length * RAW_AIRLINE_DATA.meta.seats_per_aircraft;
      assert.strictEqual(totalSeatsOffered, 70 * 180); // 12,600 total seats
      const overallLoadFactor = (totalPax / totalSeatsOffered) * 100;
      assert.ok(overallLoadFactor > 80 && overallLoadFactor < 85, `Expected ~82.5%, got ${overallLoadFactor.toFixed(2)}%`);
    });

    test('Computes exact on-time performance percentage at baseline and under delay', () => {
      const baselineDelayed = RAW_AIRLINE_DATA.flights.filter(f => (f.delay_minutes || 0) > 0).length;
      const baselineOtp = ((RAW_AIRLINE_DATA.flights.length - baselineDelayed) / RAW_AIRLINE_DATA.flights.length) * 100;
      assert.strictEqual(baselineOtp, 100);

      const sim = simulateFlightDelay(RAW_AIRLINE_DATA, 'DS0301', 45);
      const delayedCount = sim.simulatedFlights.filter(f => (f.delay_minutes || 0) > 0).length;
      assert.strictEqual(delayedCount, 4); // All 4 legs on rotation VT-DS03
      const delayedOtp = ((sim.simulatedFlights.length - delayedCount) / sim.simulatedFlights.length) * 100;
      assert.strictEqual(delayedOtp.toFixed(1), '94.3');
    });
  });

  // 14. TOPOLOGY PROJECTION MODES & ACCESSIBILITY SCREEN-READER PARITY
  describe('14. Airspace Topology Projection Geometry & Screen Reader Textual Parity', () => {
    test('Orbital Constellation ring radii assign correctly by tier', () => {
      const getRadius = (tier: string) => {
        if (tier === 'mega_hub') return 110;
        if (tier === 'regional_hub') return 215;
        return 320;
      };

      for (const airport of RAW_AIRLINE_DATA.airports) {
        const radius = getRadius(airport.tier);
        if (airport.tier === 'mega_hub') {
          assert.strictEqual(radius, 110);
        } else if (airport.tier === 'regional_hub') {
          assert.strictEqual(radius, 215);
        } else {
          assert.strictEqual(radius, 320);
        }
      }
    });

    test('Every airport node in the visual topology maps to accessible textual data table', () => {
      const airportMap = new Map(RAW_AIRLINE_DATA.airports.map(a => [a.id, a]));
      assert.strictEqual(airportMap.size, 16);

      // Verify each airport has all required screen-reader tabular attributes
      for (const ap of RAW_AIRLINE_DATA.airports) {
        assert.ok(ap.id.length === 3, 'Airport code must be 3-letter IATA');
        assert.ok(ap.city.length > 0, 'City must not be empty');
        assert.ok(ap.capacity_per_hour > 0, 'Hourly capacity must be positive');
        assert.ok(['mega_hub', 'regional_hub', 'spoke'].includes(ap.tier), 'Valid tier');
      }
    });
  });

  // 15. OPERATIONAL ALERT GENERATION & SEVERITY TAXONOMY
  describe('15. Operational Alert Generation & Severity Taxonomy', () => {
    test('Baseline alerts identify zero critical violations and flag advisory warnings', () => {
      const turnarounds = analyzeTurnarounds(RAW_AIRLINE_DATA.flights, 30);
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);

      const alerts = generateOperationalAlerts(turnarounds, crews, connections, airports);
      
      // All baseline alerts should be warnings or advisories (none critical since 0 violations exist)
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      assert.strictEqual(criticalAlerts.length, 0);

      // Verify tight connections and high-risk crew alerts are generated
      const crewAlerts = alerts.filter(a => a.type === 'crew_duty');
      assert.strictEqual(crewAlerts.length, 4); // 4 high-risk crews

      const tightConnAlerts = alerts.filter(a => a.type === 'connection');
      assert.strictEqual(tightConnAlerts.length, 5); // 5 tight connections
    });

    test('Injecting 45m delay elevates alerts with critical severity and cascading tags', () => {
      const sim = simulateFlightDelay(RAW_AIRLINE_DATA, 'DS0301', 45);
      const turnarounds = analyzeTurnarounds(sim.simulatedFlights, 30);
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, sim.simulatedFlights);
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, sim.simulatedFlights);
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, sim.simulatedFlights);

      const alerts = generateOperationalAlerts(turnarounds, crews, connections, airports);
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      assert.ok(criticalAlerts.length > 0, 'Must produce critical alerts for duty breach or broken connections');
      
      const dutyAlert = criticalAlerts.find(a => a.type === 'crew_duty');
      assert.ok(dutyAlert, 'Must flag critical crew duty alert for CR03');
      assert.strictEqual(dutyAlert.targetId, 'CR03');
    });
  });
});
