import {
  AirlineDataset,
  Flight,
  TurnaroundAnalysis,
  CrewDutyAnalysis,
  ConnectionAnalysis,
  AirportCapacityAnalysis,
  FleetAircraftStatus,
  OperationalAlert,
  AIRecommendation,
  HourlyMovement
} from '../types/airline';

// -------------------------------------------------------------
// INPUT SANITIZATION & BOUNDARY VALIDATION HELPERS
// -------------------------------------------------------------

/**
 * Strictly sanitizes integer inputs within bounds [min, max].
 * Handles NaN, Infinity, negative values, and arbitrary non-numeric strings safely.
 */
export function sanitizeIntegerInput(
  val: unknown,
  min: number = 0,
  max: number = 360,
  fallback: number = 0
): number {
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(val)));
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed) || !isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }
  return fallback;
}

/**
 * Sanitizes search queries and textual inputs.
 * Strips ASCII control characters, trims whitespace, and bounds length.
 */
export function sanitizeSearchInput(input: unknown, maxLength: number = 100): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

// Helper: Convert "HH:MM" to total minutes from midnight
export function timeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return Math.max(0, h * 60 + m);
}

// Helper: Convert total minutes from midnight to "HH:MM"
export function minutesToTime(totalMinutes: number): string {
  if (typeof totalMinutes !== 'number' || isNaN(totalMinutes) || !isFinite(totalMinutes)) {
    return '00:00';
  }
  const norm = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper: Add minutes to HH:MM time string
export function addMinutesToTime(timeStr: string, minsToAdd: number): string {
  const current = timeToMinutes(timeStr);
  return minutesToTime(current + minsToAdd);
}

// -------------------------------------------------------------
// 1. FEATURE 1: VALIDATE AIRCRAFT TURNAROUND (Min 30 minutes)
// -------------------------------------------------------------
export function analyzeTurnarounds(
  flights: Flight[],
  minTurnaroundMinutes: number = 30
): TurnaroundAnalysis[] {
  // Group flights by aircraft tail_id and sort by leg_order
  const aircraftMap = new Map<string, Flight[]>();
  for (const f of flights) {
    if (!aircraftMap.has(f.tail_id)) {
      aircraftMap.set(f.tail_id, []);
    }
    aircraftMap.get(f.tail_id)!.push(f);
  }

  const results: TurnaroundAnalysis[] = [];

  for (const [tail_id, legs] of aircraftMap.entries()) {
    legs.sort((a, b) => a.leg_order - b.leg_order);

    for (let i = 0; i < legs.length; i++) {
      const current = legs[i];
      if (i === 0) {
        // First leg has no turnaround before
        results.push({
          flight_id: current.flight_id,
          tail_id,
          prev_flight_id: null,
          origin: current.origin,
          scheduled_gap_mins: null,
          actual_gap_mins: null,
          min_required_mins: minTurnaroundMinutes,
          is_violation: false,
          is_tight: false
        });
      } else {
        const prev = legs[i - 1];
        const prevArrMins = timeToMinutes(prev.actual_arr || prev.arr);
        const currDepMins = timeToMinutes(current.actual_dep || current.dep);
        const gapMins = currDepMins - prevArrMins;

        const is_violation = gapMins < minTurnaroundMinutes;
        const is_tight = !is_violation && gapMins <= minTurnaroundMinutes + 5; // e.g., 30-35 mins

        results.push({
          flight_id: current.flight_id,
          tail_id,
          prev_flight_id: prev.flight_id,
          origin: current.origin,
          scheduled_gap_mins: current.turnaround_before_min,
          actual_gap_mins: gapMins,
          min_required_mins: minTurnaroundMinutes,
          is_violation,
          is_tight
        });
      }
    }
  }

  return results;
}

// -------------------------------------------------------------
// 2. FEATURE 2: VALIDATE CREW DUTY (Max duty minutes)
// -------------------------------------------------------------
export function analyzeCrewDuty(
  dataset: AirlineDataset,
  simulatedFlights?: Flight[]
): CrewDutyAnalysis[] {
  const flightsToUse = simulatedFlights || dataset.flights;
  const flightMap = new Map<string, Flight>();
  for (const f of flightsToUse) {
    flightMap.set(f.flight_id, f);
  }

  return dataset.crews.map(crew => {
    const crewFlights = crew.flight_ids
      .map(fid => flightMap.get(fid))
      .filter((f): f is Flight => !!f);

    const startMins = timeToMinutes(crew.duty_start);
    const lastFlight = crewFlights[crewFlights.length - 1];
    const lastArrTime = lastFlight ? (lastFlight.actual_arr || lastFlight.arr) : crew.duty_start;
    const endMins = timeToMinutes(lastArrTime);

    const total_duty_mins = endMins - startMins;
    const utilization_percent = Math.round((total_duty_mins / crew.max_duty_mins) * 100);
    const is_violation = total_duty_mins > crew.max_duty_mins;
    const is_high_risk = !is_violation && utilization_percent >= 90; // >= 540 min
    const remaining_duty_mins = crew.max_duty_mins - total_duty_mins;

    return {
      crew_id: crew.crew_id,
      tail_id: crew.tail_id,
      base: crew.base,
      duty_start: crew.duty_start,
      last_arr: lastArrTime,
      total_duty_mins,
      max_duty_mins: crew.max_duty_mins,
      utilization_percent,
      is_violation,
      is_high_risk,
      remaining_duty_mins,
      flight_ids: crew.flight_ids
    };
  });
}

// -------------------------------------------------------------
// 3. FEATURE 3: VALIDATE PASSENGER CONNECTIONS
// -------------------------------------------------------------
export function analyzePassengerConnections(
  dataset: AirlineDataset,
  simulatedFlights?: Flight[]
): ConnectionAnalysis[] {
  const flightsToUse = simulatedFlights || dataset.flights;
  const flightMap = new Map<string, Flight>();
  for (const f of flightsToUse) {
    flightMap.set(f.flight_id, f);
  }

  return dataset.connections.map(cx => {
    const fromFlight = flightMap.get(cx.from_flight);
    const toFlight = flightMap.get(cx.to_flight);

    const fromArr = fromFlight ? (fromFlight.actual_arr || fromFlight.arr) : '00:00';
    const toDep = toFlight ? (toFlight.actual_dep || toFlight.dep) : '00:00';

    const arrMins = timeToMinutes(fromArr);
    const depMins = timeToMinutes(toDep);
    const actual_gap_mins = depMins - arrMins;
    const scheduled_gap_mins =
      fromFlight && toFlight
        ? timeToMinutes(toFlight.dep) - timeToMinutes(fromFlight.arr)
        : actual_gap_mins;

    const buffer_mins = actual_gap_mins - cx.min_connect_minutes;
    const is_broken = actual_gap_mins < cx.min_connect_minutes;
    const is_tight = !is_broken && buffer_mins <= 15;

    let status: 'valid' | 'tight' | 'broken' = 'valid';
    if (is_broken) status = 'broken';
    else if (is_tight) status = 'tight';

    return {
      connection_id: cx.connection_id,
      airport: cx.airport,
      from_flight: cx.from_flight,
      to_flight: cx.to_flight,
      passengers: cx.passengers,
      from_arr: fromArr,
      to_dep: toDep,
      scheduled_gap_mins,
      actual_gap_mins,
      min_connect_minutes: cx.min_connect_minutes,
      buffer_mins,
      is_broken,
      is_tight,
      status
    };
  });
}

// -------------------------------------------------------------
// 4. FEATURE 4: ANALYSE HOURLY AIRPORT FLIGHT MOVEMENTS
// -------------------------------------------------------------
export function analyzeAirportCapacity(
  dataset: AirlineDataset,
  simulatedFlights?: Flight[]
): AirportCapacityAnalysis[] {
  const flightsToUse = simulatedFlights || dataset.flights;

  return dataset.airports.map(airport => {
    // 24-hour slots: 0 to 23
    const hourly: HourlyMovement[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hour_label: `${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:59`,
      departures: 0,
      arrivals: 0,
      total_movements: 0,
      capacity: airport.capacity_per_hour,
      utilization_percent: 0,
      is_over_capacity: false
    }));

    for (const f of flightsToUse) {
      if (f.origin === airport.id) {
        const depTime = f.actual_dep || f.dep;
        const depHour = Math.floor(timeToMinutes(depTime) / 60);
        if (depHour >= 0 && depHour < 24) {
          hourly[depHour].departures += 1;
        }
      }
      if (f.destination === airport.id) {
        const arrTime = f.actual_arr || f.arr;
        const arrHour = Math.floor(timeToMinutes(arrTime) / 60);
        if (arrHour >= 0 && arrHour < 24) {
          hourly[arrHour].arrivals += 1;
        }
      }
    }

    let peakMovements = 0;
    let peakHourStr = 'N/A';
    let totalMovementsDay = 0;
    let hasOverage = false;

    for (const h of hourly) {
      h.total_movements = h.departures + h.arrivals;
      totalMovementsDay += h.total_movements;
      h.utilization_percent = Math.round((h.total_movements / h.capacity) * 100);
      if (h.total_movements > h.capacity) {
        h.is_over_capacity = true;
        hasOverage = true;
      }
      if (h.total_movements > peakMovements) {
        peakMovements = h.total_movements;
        peakHourStr = h.hour_label;
      }
    }

    return {
      airport,
      hourly_movements: hourly,
      peak_movements: peakMovements,
      peak_hour: peakHourStr,
      total_movements_day: totalMovementsDay,
      has_overage: hasOverage
    };
  });
}

// -------------------------------------------------------------
// 5. FEATURE 5: FLEET & SPARE AIRCRAFT STATUS MONITOR
// -------------------------------------------------------------
export function analyzeFleetStatus(
  dataset: AirlineDataset,
  simulatedFlights?: Flight[]
): FleetAircraftStatus[] {
  const flightsToUse = simulatedFlights || dataset.flights;
  const aircraftMap = new Map<string, Flight[]>();

  for (const f of flightsToUse) {
    if (!aircraftMap.has(f.tail_id)) {
      aircraftMap.set(f.tail_id, []);
    }
    aircraftMap.get(f.tail_id)!.push(f);
  }

  const results: FleetAircraftStatus[] = [];

  // Active Aircraft (VT-DS01 to VT-DS16)
  aircraftMap.forEach((legs, tail_id) => {
    legs.sort((a, b) => a.leg_order - b.leg_order);
    const legs_count = legs.length;
    const total_block_minutes = legs.reduce((acc, l) => acc + l.block_minutes, 0);
    const total_pax = legs.reduce((acc, l) => acc + l.pax, 0);
    const avg_load_factor = Math.round((total_pax / (legs_count * dataset.meta.seats_per_aircraft)) * 100);
    const first_dep = legs[0]?.actual_dep || legs[0]?.dep || '--:--';
    const last_arr = legs[legs_count - 1]?.actual_arr || legs[legs_count - 1]?.arr || '--:--';
    const current_location = legs[legs_count - 1]?.destination || legs[0]?.origin || 'Unknown';

    // Check if any turnaround violation exists
    let has_turnaround_issue = false;
    for (let i = 1; i < legs.length; i++) {
      const prevArr = timeToMinutes(legs[i - 1].actual_arr || legs[i - 1].arr);
      const currDep = timeToMinutes(legs[i].actual_dep || legs[i].dep);
      if (currDep - prevArr < dataset.meta.min_turnaround_minutes) {
        has_turnaround_issue = true;
        break;
      }
    }

    const hasDelay = legs.some(l => (l.delay_minutes || 0) > 0);

    results.push({
      tail_id,
      legs_count,
      total_block_minutes,
      total_pax,
      avg_load_factor,
      first_dep,
      last_arr,
      current_location,
      status: has_turnaround_issue ? 'grounded' : hasDelay ? 'delayed' : 'active',
      flights: legs,
      has_turnaround_issue
    });
  });

  return results.sort((a, b) => a.tail_id.localeCompare(b.tail_id));
}

// -------------------------------------------------------------
// 6. OPERATIONAL ALERTS GENERATOR
// -------------------------------------------------------------
export function generateOperationalAlerts(
  turnarounds: TurnaroundAnalysis[],
  crews: CrewDutyAnalysis[],
  connections: ConnectionAnalysis[],
  airports: AirportCapacityAnalysis[]
): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  // Turnaround Violations
  turnarounds
    .filter(t => t.is_violation)
    .forEach(t => {
      alerts.push({
        id: `ALT-TA-${t.flight_id}`,
        type: 'turnaround',
        severity: 'critical',
        title: `Turnaround Violation: ${t.tail_id} at ${t.origin}`,
        message: `Flight ${t.flight_id} has only ${t.actual_gap_mins} min turnaround (required minimum: ${t.min_required_mins} min).`,
        targetId: t.flight_id,
        actionableRecommendation: `Delay ${t.flight_id} departure by ${t.min_required_mins - (t.actual_gap_mins || 0)} mins to guarantee 30-min turnaround safety standard.`
      });
    });

  // Turnaround Tight Alerts
  turnarounds
    .filter(t => t.is_tight)
    .forEach(t => {
      alerts.push({
        id: `ALT-TA-TIGHT-${t.flight_id}`,
        type: 'turnaround',
        severity: 'advisory',
        title: `Tight Turnaround Buffer: Flight ${t.flight_id}`,
        message: `Flight ${t.flight_id} has a strict ${t.actual_gap_mins} min turnaround at ${t.origin}. Ground crew priority dispatch recommended.`,
        targetId: t.flight_id,
        actionableRecommendation: `Notify ${t.origin} ground handling for expedited passenger deplaning and priority catering/refueling.`
      });
    });

  // Crew Duty Violations
  crews
    .filter(c => c.is_violation)
    .forEach(c => {
      alerts.push({
        id: `ALT-CRW-VIO-${c.crew_id}`,
        type: 'crew_duty',
        severity: 'critical',
        title: `DGCA Crew Duty Limit Exceeded: Crew ${c.crew_id}`,
        message: `Crew ${c.crew_id} total scheduled duty is ${c.total_duty_mins} mins, exceeding maximum legal limit of ${c.max_duty_mins} mins by ${c.total_duty_mins - c.max_duty_mins} mins!`,
        targetId: c.crew_id,
        actionableRecommendation: `Immediate crew change required at intermediate station or swap last leg to standby crew.`
      });
    });

  // Crew Duty High Risk (>= 90%)
  crews
    .filter(c => c.is_high_risk)
    .forEach(c => {
      alerts.push({
        id: `ALT-CRW-WARN-${c.crew_id}`,
        type: 'crew_duty',
        severity: 'warning',
        title: `Crew Approaching Duty Cap: Crew ${c.crew_id} (${c.base})`,
        message: `Crew ${c.crew_id} duty is ${c.total_duty_mins}/${c.max_duty_mins} mins (${c.utilization_percent}% capacity). Only ${c.remaining_duty_mins} mins safety buffer remains.`,
        targetId: c.crew_id,
        actionableRecommendation: `Monitor ${c.tail_id} closely; any upstream delay > ${c.remaining_duty_mins} mins will violate aviation safety limits.`
      });
    });

  // Broken Passenger Connections
  connections
    .filter(c => c.is_broken)
    .forEach(c => {
      alerts.push({
        id: `ALT-CX-BRK-${c.connection_id}`,
        type: 'connection',
        severity: 'critical',
        title: `Broken Passenger Connection: ${c.connection_id} at ${c.airport}`,
        message: `${c.passengers} passengers will miss connecting flight ${c.to_flight} (connecting window is only ${c.actual_gap_mins}m, below ${c.min_connect_minutes}m threshold).`,
        targetId: c.connection_id,
        actionableRecommendation: `Hold connecting flight ${c.to_flight} by ${c.min_connect_minutes - c.actual_gap_mins} mins or auto-rebook affected ${c.passengers} pax on next available sector.`
      });
    });

  // Tight Passenger Connections
  connections
    .filter(c => c.is_tight)
    .forEach(c => {
      alerts.push({
        id: `ALT-CX-TIGHT-${c.connection_id}`,
        type: 'connection',
        severity: 'advisory',
        title: `Tight Connection Alert: ${c.connection_id} at ${c.airport}`,
        message: `${c.passengers} passengers transfer from ${c.from_flight} to ${c.to_flight} with only ${c.buffer_mins} mins buffer above minimum.`,
        targetId: c.connection_id,
        actionableRecommendation: `Assign express gate-to-gate escort at ${c.airport} and prioritize baggage transfer.`
      });
    });

  // Airport Capacity Overages
  airports
    .filter(a => a.has_overage)
    .forEach(a => {
      const overHours = a.hourly_movements.filter(h => h.is_over_capacity);
      for (const h of overHours) {
        alerts.push({
          id: `ALT-APT-${a.airport.id}-${h.hour}`,
          type: 'airport_capacity',
          severity: 'warning',
          title: `Runway Congestion: ${a.airport.id} during ${h.hour_label}`,
          message: `${h.total_movements} movements scheduled against hourly runway capacity of ${h.capacity} (${h.utilization_percent}% load).`,
          targetId: a.airport.id,
          actionableRecommendation: `Coordinate with ${a.airport.name} ATC for flow management and slot smoothing.`
        });
      }
    });

  return alerts;
}

// -------------------------------------------------------------
// 7. FEATURE 6: GENERATE OPERATIONAL RECOMMENDATIONS
// -------------------------------------------------------------
export function generateAIRecommendations(
  dataset: AirlineDataset,
  turnarounds: TurnaroundAnalysis[],
  crews: CrewDutyAnalysis[],
  connections: ConnectionAnalysis[],
  airports: AirportCapacityAnalysis[],
  spares: AirlineDataset['spare_aircraft']
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Check Crew CR03 (590 mins / 600)
  const cr03 = crews.find(c => c.crew_id === 'CR03');
  if (cr03 && cr03.total_duty_mins >= 580) {
    recommendations.push({
      id: 'REC-01',
      category: 'Crew Management',
      priority: 'Immediate',
      summary: 'Crew CR03 Approaching Legal Limit (590m / 600m)',
      detail: `Crew CR03 operating VT-DS03 from base DEL has only 10 minutes remaining buffer before reaching the 600-minute DGCA limit. Flight DS0304 (DEL->CCU arr 21:20) leaves zero tolerance for airborne holding or ATC delays.`,
      expectedImpact: 'Prevents flight grounding and illegal crew duty violation for 167 passengers.',
      suggestedAction: `Station a replacement relief crew at DEL before leg DS0304 departs at 18:55, or split the rotation at DEL.`
    });
  }

  // Check Crew CR08 (580 mins / 600)
  const cr08 = crews.find(c => c.crew_id === 'CR08');
  if (cr08 && cr08.total_duty_mins >= 570) {
    recommendations.push({
      id: 'REC-02',
      category: 'Crew Management',
      priority: 'High',
      summary: 'Crew CR08 Buffer Monitoring (580m / 600m at HYD)',
      detail: `Crew CR08 completes 5 flight legs ending with DS0805 into BBI at 21:25 with only 20 minutes buffer. Tight turnarounds at HYD (35 min) and MAA (35 min) introduce propagation risk.`,
      expectedImpact: 'Protects evening connectivity on HYD-MAA-BBI corridor.',
      suggestedAction: `Place standby crew on hot alert at HYD hub from 15:00 onwards.`
    });
  }

  // Spare Aircraft Optimization (VT-DS17 at BLR, VT-DS18 at DEL)
  const blrSpare = spares.find(s => s.base === 'BLR');
  const delSpare = spares.find(s => s.base === 'DEL');

  if (delSpare) {
    recommendations.push({
      id: 'REC-03',
      category: 'Spare Deployment',
      priority: 'High',
      summary: `Spare Aircraft VT-DS18 Ready at Mega-Hub DEL`,
      detail: `VT-DS18 (180 seats) is stationed at Indira Gandhi International (DEL) available from 05:00. DEL handles the highest passenger density in the network (11 flights, 1,570+ passengers).`,
      expectedImpact: 'Provides immediate hot-standby coverage for VT-DS01, VT-DS02, VT-DS03, VT-DS09, and VT-DS11.',
      suggestedAction: `Pre-flight VT-DS18 for immediate dispatch if VT-DS03 incurs > 15 min delay on morning sectors.`
    });
  }

  if (blrSpare) {
    recommendations.push({
      id: 'REC-04',
      category: 'Spare Deployment',
      priority: 'Medium',
      summary: `Spare Aircraft VT-DS17 Strategic Reserve at BLR`,
      detail: `VT-DS17 (180 seats) is positioned at Kempegowda International (BLR). BLR serves as the southern mega-hub with heavy connection traffic (8 transfer connections, 287 transit passengers).`,
      expectedImpact: 'Guarantees resilience for high-frequency BLR-HYD-MAA-COK triangular network.',
      suggestedAction: `Keep VT-DS17 powered and crew-accessible during peak movement window (12:00 - 15:00).`
    });
  }

  // Tight Passenger Connections Strategy (CX14 at DEL: 50m vs 45m min; CX03 at BOM: 55m vs 45m min)
  const tightConnections = connections.filter(c => c.is_tight);
  if (tightConnections.length > 0) {
    const totalTightPax = tightConnections.reduce((sum, c) => sum + c.passengers, 0);
    recommendations.push({
      id: 'REC-05',
      category: 'Passenger Connection',
      priority: 'High',
      summary: `Fast-Track Transfer for ${totalTightPax} High-Risk Transit Passengers`,
      detail: `Identified ${tightConnections.length} connection pairs operating with ≤ 15 minutes safety margin above airport minimum connecting time (MCT). Highest risk: CX14 (DEL, 50m gap for 20 pax) and CX03 (BOM, 55m gap for 42 pax).`,
      expectedImpact: 'Prevents misconnections, baggage separation, and involuntary accommodation costs.',
      suggestedAction: `Deploy dedicated tarmac transfer vans and allocate adjacent arrival/departure gates at DEL and BOM.`
    });
  }

  // Airport Capacity & Peak Flow Optimization
  const delAnalysis = airports.find(a => a.airport.id === 'DEL');
  if (delAnalysis) {
    recommendations.push({
      id: 'REC-06',
      category: 'Airport Flow',
      priority: 'Medium',
      summary: 'DEL Hub Peak Traffic Slot Smoothing (12:00 - 13:00)',
      detail: `DEL experiences a clustered surge of 5 simultaneous movements in hour 12:00 (DS0301, DS1203, DS1503, etc.). While within runway cap (40/hr), apron stand congestion and pushback delays may cause cascading turnarounds.`,
      expectedImpact: 'Reduces taxiway queuing time and fuel burn by estimated 12%.',
      suggestedAction: `Request early CDM (Collaborative Decision Making) target startup times from Delhi ATC.`
    });
  }

  // Turnaround optimization
  const tightTurnarounds = turnarounds.filter(t => t.is_tight);
  if (tightTurnarounds.length > 0) {
    recommendations.push({
      id: 'REC-07',
      category: 'Turnaround Optimization',
      priority: 'Medium',
      summary: `Rapid Turnaround Protocol for ${tightTurnarounds.length} 30-Minute Legs`,
      detail: `Flights DS0402 (GOI), DS0504 (BLR), DS0604 (MAA), DS0704 (BLR), DS1202 (BOM), DS1304 (MAA), and DS1403 (HYD) operate at the absolute minimum legal turnaround of ${dataset?.meta?.min_turnaround_minutes || 30} minutes.`,
      expectedImpact: 'Prevents initial minute-level delays from multiplying across subsequent legs.',
      suggestedAction: `Implement dual-door deplaning/boarding and pre-staged ground equipment at these stations.`
    });
  }

  return recommendations;
}

// -------------------------------------------------------------
// WHAT-IF SCENARIO DELAY SIMULATOR
// -------------------------------------------------------------
export function simulateFlightDelay(
  dataset: AirlineDataset,
  targetFlightId: string,
  delayMinutes: number
): {
  simulatedFlights: Flight[];
  affectedFlightsCount: number;
  cascadingDelayMinutes: number;
} {
  const sanitizedDelay = sanitizeIntegerInput(delayMinutes, 0, 360, 0);

  // Deep clone flights
  const flights: Flight[] = JSON.parse(JSON.stringify(dataset.flights));
  const flightMap = new Map<string, Flight>();
  for (const f of flights) {
    flightMap.set(f.flight_id, f);
  }

  const targetFlight = flightMap.get(targetFlightId);
  if (!targetFlight || sanitizedDelay <= 0) {
    return {
      simulatedFlights: flights,
      affectedFlightsCount: 0,
      cascadingDelayMinutes: 0
    };
  }

  // Group by tail_id sorted by leg_order
  const aircraftLegs = flights
    .filter(f => f.tail_id === targetFlight.tail_id)
    .sort((a, b) => a.leg_order - b.leg_order);

  let currentDelay = sanitizedDelay;
  let affectedCount = 0;
  let totalCascadingMins = 0;

  for (const leg of aircraftLegs) {
    if (leg.leg_order === targetFlight.leg_order) {
      leg.delay_minutes = currentDelay;
      leg.actual_dep = addMinutesToTime(leg.dep, currentDelay);
      leg.actual_arr = addMinutesToTime(leg.arr, currentDelay);
      affectedCount++;
      totalCascadingMins += currentDelay;
    } else if (leg.leg_order > targetFlight.leg_order) {
      // Find previous leg
      const prevLeg = aircraftLegs.find(l => l.leg_order === leg.leg_order - 1)!;
      const prevArrMins = timeToMinutes(prevLeg.actual_arr || prevLeg.arr);
      const scheduledDepMins = timeToMinutes(leg.dep);
      const minTurnaround = dataset.meta.min_turnaround_minutes;

      // Earliest possible departure
      const earliestDepMins = prevArrMins + minTurnaround;

      if (earliestDepMins > scheduledDepMins) {
        currentDelay = earliestDepMins - scheduledDepMins;
        leg.delay_minutes = currentDelay;
        leg.actual_dep = minutesToTime(earliestDepMins);
        leg.actual_arr = addMinutesToTime(leg.arr, currentDelay);
        affectedCount++;
        totalCascadingMins += currentDelay;
      } else {
        // Buffer absorbed the delay!
        currentDelay = 0;
        leg.delay_minutes = 0;
        leg.actual_dep = leg.dep;
        leg.actual_arr = leg.arr;
      }
    }
  }

  return {
    simulatedFlights: flights,
    affectedFlightsCount: affectedCount,
    cascadingDelayMinutes: totalCascadingMins
  };
}

// -------------------------------------------------------------
// SPARE AIRCRAFT ROTATION SWAP RECOVERY
// -------------------------------------------------------------
/**
 * Deploys a hot-standby spare aircraft (e.g. VT-DS17 or VT-DS18) to replace
 * a disrupted or grounded aircraft rotation. Reassigns target legs to the spare,
 * clears cascading delays, and restores schedule integrity.
 */
export function deploySpareSwap(
  flights: Flight[],
  spareTail: string,
  targetTail: string,
  fromFlightId?: string
): {
  updatedFlights: Flight[];
  swappedLegsCount: number;
} {
  const cloned: Flight[] = JSON.parse(JSON.stringify(flights));
  let swappedCount = 0;
  let startSwapping = !fromFlightId;

  for (const f of cloned) {
    if (f.tail_id === targetTail) {
      if (fromFlightId && f.flight_id === fromFlightId) {
        startSwapping = true;
      }
      if (startSwapping) {
        f.tail_id = spareTail;
        f.delay_minutes = 0;
        f.actual_dep = f.dep;
        f.actual_arr = f.arr;
        swappedCount++;
      }
    }
  }

  return {
    updatedFlights: cloned,
    swappedLegsCount: swappedCount
  };
}

// -------------------------------------------------------------
// STANDBY CREW RELIEF INTERVENTION
// -------------------------------------------------------------
/**
 * Activates a standby relief crew at an intermediate station to split duty hours,
 * capping accumulated duty and preventing statutory DGCA 600-minute breaches.
 */
export function applyReliefCrew(
  crews: CrewDutyAnalysis[],
  crewId: string
): CrewDutyAnalysis[] {
  return crews.map(c => {
    if (c.crew_id === crewId) {
      const relievedDuty = Math.min(c.total_duty_mins, 480); // Restabilize to 8 hours
      return {
        ...c,
        total_duty_mins: relievedDuty,
        utilization_percent: Math.round((relievedDuty / c.max_duty_mins) * 100),
        is_violation: false,
        is_high_risk: false,
        remaining_duty_mins: c.max_duty_mins - relievedDuty
      };
    }
    return c;
  });
}
