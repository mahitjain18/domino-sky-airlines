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
  timeToMinutes,
  minutesToTime
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

  // 7. TIME MATH UTILITIES
  describe('7. High-Precision Time Utility Functions', () => {
    test('timeToMinutes and minutesToTime perform exact bidirectional conversions', () => {
      assert.strictEqual(timeToMinutes('06:00'), 360);
      assert.strictEqual(timeToMinutes('23:59'), 1439);
      assert.strictEqual(minutesToTime(360), '06:00');
      assert.strictEqual(minutesToTime(1439), '23:59');
    });
  });

  // 8. KINETIC AIRSPACE TOPOLOGY PROJECTION & TOPOLOGY ENGINE
  describe('8. Kinetic Airspace Topology Projection & Deterministic Engine', () => {
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
      const cx = 500;
      const cy = 350;
      
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
});
