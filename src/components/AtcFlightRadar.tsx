import React from 'react';
import { Airport, Flight, SpareAircraft } from '../types/airline';
import { KineticAirspaceTopology } from './KineticAirspaceTopology';

export interface AtcFlightRadarProps {
  airports: Airport[];
  flights: Flight[];
  spares?: SpareAircraft[];
  selectedFlightId?: string | null;
  onSelectFlight: (flight: Flight) => void;
  selectedAirportId?: string | null;
  onSelectAirport?: (airportId: string | null) => void;
  onSimulateDelay?: (flightId: string) => void;
}

/**
 * Backward compatibility wrapper routing directly to KineticAirspaceTopology.
 * Guarantees zero regression across legacy view imports while serving the new
 * premium multi-mode Kinetic Airspace Topology experience.
 */
export const AtcFlightRadar: React.FC<AtcFlightRadarProps> = props => {
  return <KineticAirspaceTopology {...props} />;
};

export default AtcFlightRadar;
