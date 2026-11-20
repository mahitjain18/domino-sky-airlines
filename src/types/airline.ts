export interface DatasetMeta {
  dataset: string;
  operating_day: string;
  min_turnaround_minutes: number;
  seats_per_aircraft: number;
  notes: string[];
}

export interface Airport {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  tier: 'mega_hub' | 'regional_hub' | 'spoke';
  capacity_per_hour: number;
}

export interface Flight {
  flight_id: string;
  tail_id: string;
  leg_order: number;
  origin: string;
  destination: string;
  dep: string; // HH:MM
  arr: string; // HH:MM
  block_minutes: number;
  pax: number;
  turnaround_before_min: number | null;
  // Dynamic fields when simulating delays
  delay_minutes?: number;
  actual_dep?: string;
  actual_arr?: string;
}

export interface Connection {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  min_connect_minutes: number;
}

export interface Crew {
  crew_id: string;
  tail_id: string;
  base: string;
  duty_start: string; // HH:MM
  max_duty_mins: number;
  flight_ids: string[];
}

export interface SpareAircraft {
  tail_id: string;
  base: string;
  available_from: string; // HH:MM
  seats: number;
  assigned_replacement_for?: string | null;
}

export interface AirlineDataset {
  meta: DatasetMeta;
  airports: Airport[];
  flights: Flight[];
  connections: Connection[];
  crews: Crew[];
  spare_aircraft: SpareAircraft[];
}

export type AlertSeverity = 'critical' | 'warning' | 'advisory' | 'info';

export interface OperationalAlert {
  id: string;
  type: 'turnaround' | 'crew_duty' | 'connection' | 'airport_capacity' | 'fleet';
  severity: AlertSeverity;
  title: string;
  message: string;
  targetId: string;
  timestamp?: string;
  actionableRecommendation?: string;
}

export interface TurnaroundAnalysis {
  flight_id: string;
  tail_id: string;
  prev_flight_id: string | null;
  origin: string;
  scheduled_gap_mins: number | null;
  actual_gap_mins: number | null;
  min_required_mins: number;
  is_violation: boolean;
  is_tight: boolean; // < 35 min
}

export interface CrewDutyAnalysis {
  crew_id: string;
  tail_id: string;
  base: string;
  duty_start: string;
  last_arr: string;
  total_duty_mins: number;
  max_duty_mins: number;
  utilization_percent: number;
  is_violation: boolean;
  is_high_risk: boolean; // >= 90% (>= 540 min)
  remaining_duty_mins: number;
  flight_ids: string[];
}

export interface ConnectionAnalysis {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  from_arr: string;
  to_dep: string;
  scheduled_gap_mins: number;
  actual_gap_mins: number;
  min_connect_minutes: number;
  buffer_mins: number;
  is_broken: boolean;
  is_tight: boolean; // buffer < 15 min
  status: 'valid' | 'tight' | 'broken';
}

export interface HourlyMovement {
  hour: number;
  hour_label: string; // "06:00 - 06:59"
  departures: number;
  arrivals: number;
  total_movements: number;
  capacity: number;
  utilization_percent: number;
  is_over_capacity: boolean;
}

export interface AirportCapacityAnalysis {
  airport: Airport;
  hourly_movements: HourlyMovement[];
  peak_movements: number;
  peak_hour: string;
  total_movements_day: number;
  has_overage: boolean;
}

export interface FleetAircraftStatus {
  tail_id: string;
  legs_count: number;
  total_block_minutes: number;
  total_pax: number;
  avg_load_factor: number;
  first_dep: string;
  last_arr: string;
  current_location: string;
  status: 'active' | 'spare_ready' | 'delayed' | 'grounded';
  flights: Flight[];
  has_turnaround_issue: boolean;
}

export interface AIRecommendation {
  id: string;
  category: 'Crew Management' | 'Turnaround Optimization' | 'Passenger Connection' | 'Airport Flow' | 'Spare Deployment';
  priority: 'Immediate' | 'High' | 'Medium' | 'Routine';
  summary: string;
  detail: string;
  expectedImpact: string;
  suggestedAction: string;
}
