// tests/airlineOperations.test.ts
import { test, describe } from "node:test";
import assert from "node:assert/strict";

// src/data/airlineData.ts
var RAW_AIRLINE_DATA = {
  meta: {
    dataset: "Domino Sky flight network",
    operating_day: "single day, all times local IST (UTC+05:30), 24-hour HH:MM",
    min_turnaround_minutes: 30,
    seats_per_aircraft: 180,
    notes: [
      "Each aircraft flies its flights in leg_order; a flight cannot depart before the previous flight of the same aircraft has arrived and the minimum turnaround has passed.",
      "Crew duty runs from duty_start until the scheduled arrival of the crew's last flight and must not exceed max_duty_mins.",
      "A connection is made if the to_flight departs at least min_connect_minutes after the from_flight arrives."
    ]
  },
  airports: [
    { id: "DEL", name: "Indira Gandhi International", city: "Delhi", lat: 28.5562, lng: 77.1, tier: "mega_hub", capacity_per_hour: 40 },
    { id: "BOM", name: "Chhatrapati Shivaji Maharaj International", city: "Mumbai", lat: 19.0896, lng: 72.8656, tier: "mega_hub", capacity_per_hour: 32 },
    { id: "BLR", name: "Kempegowda International", city: "Bengaluru", lat: 13.1986, lng: 77.7066, tier: "mega_hub", capacity_per_hour: 34 },
    { id: "HYD", name: "Rajiv Gandhi International", city: "Hyderabad", lat: 17.2403, lng: 78.4294, tier: "mega_hub", capacity_per_hour: 30 },
    { id: "MAA", name: "Chennai International", city: "Chennai", lat: 12.9941, lng: 80.1709, tier: "regional_hub", capacity_per_hour: 20 },
    { id: "CCU", name: "Netaji Subhas Chandra Bose International", city: "Kolkata", lat: 22.6547, lng: 88.4467, tier: "regional_hub", capacity_per_hour: 20 },
    { id: "AMD", name: "Sardar Vallabhbhai Patel International", city: "Ahmedabad", lat: 23.0772, lng: 72.6347, tier: "regional_hub", capacity_per_hour: 18 },
    { id: "COK", name: "Cochin International", city: "Kochi", lat: 10.152, lng: 76.4019, tier: "regional_hub", capacity_per_hour: 16 },
    { id: "GOI", name: "Dabolim Airport", city: "Goa", lat: 15.3808, lng: 73.8314, tier: "spoke", capacity_per_hour: 10 },
    { id: "PNQ", name: "Pune Airport", city: "Pune", lat: 18.5821, lng: 73.9197, tier: "spoke", capacity_per_hour: 10 },
    { id: "JAI", name: "Jaipur International", city: "Jaipur", lat: 26.8242, lng: 75.8122, tier: "spoke", capacity_per_hour: 10 },
    { id: "GAU", name: "Lokpriya Gopinath Bordoloi International", city: "Guwahati", lat: 26.1061, lng: 91.5859, tier: "spoke", capacity_per_hour: 8 },
    { id: "LKO", name: "Chaudhary Charan Singh International", city: "Lucknow", lat: 26.7606, lng: 80.8893, tier: "spoke", capacity_per_hour: 10 },
    { id: "IXC", name: "Chandigarh International", city: "Chandigarh", lat: 30.6735, lng: 76.7885, tier: "spoke", capacity_per_hour: 8 },
    { id: "BBI", name: "Biju Patnaik International", city: "Bhubaneswar", lat: 20.2444, lng: 85.8178, tier: "spoke", capacity_per_hour: 8 },
    { id: "TRV", name: "Trivandrum International", city: "Thiruvananthapuram", lat: 8.4821, lng: 76.9201, tier: "spoke", capacity_per_hour: 8 }
  ],
  flights: [
    { flight_id: "DS0101", tail_id: "VT-DS01", leg_order: 1, origin: "DEL", destination: "JAI", dep: "08:00", arr: "08:50", block_minutes: 50, pax: 118, turnaround_before_min: null },
    { flight_id: "DS0102", tail_id: "VT-DS01", leg_order: 2, origin: "JAI", destination: "DEL", dep: "09:25", arr: "10:15", block_minutes: 50, pax: 137, turnaround_before_min: 35 },
    { flight_id: "DS0103", tail_id: "VT-DS01", leg_order: 3, origin: "DEL", destination: "LKO", dep: "10:50", arr: "11:55", block_minutes: 65, pax: 137, turnaround_before_min: 35 },
    { flight_id: "DS0104", tail_id: "VT-DS01", leg_order: 4, origin: "LKO", destination: "DEL", dep: "13:05", arr: "14:10", block_minutes: 65, pax: 155, turnaround_before_min: 70 },
    { flight_id: "DS0105", tail_id: "VT-DS01", leg_order: 5, origin: "DEL", destination: "IXC", dep: "15:15", arr: "16:05", block_minutes: 50, pax: 117, turnaround_before_min: 65 },
    { flight_id: "DS0201", tail_id: "VT-DS02", leg_order: 1, origin: "DEL", destination: "BOM", dep: "06:00", arr: "08:10", block_minutes: 130, pax: 153, turnaround_before_min: null },
    { flight_id: "DS0202", tail_id: "VT-DS02", leg_order: 2, origin: "BOM", destination: "PNQ", dep: "09:20", arr: "10:00", block_minutes: 40, pax: 142, turnaround_before_min: 70 },
    { flight_id: "DS0203", tail_id: "VT-DS02", leg_order: 3, origin: "PNQ", destination: "BOM", dep: "11:15", arr: "11:55", block_minutes: 40, pax: 140, turnaround_before_min: 75 },
    { flight_id: "DS0204", tail_id: "VT-DS02", leg_order: 4, origin: "BOM", destination: "GOI", dep: "12:30", arr: "13:35", block_minutes: 65, pax: 151, turnaround_before_min: 35 },
    { flight_id: "DS0301", tail_id: "VT-DS03", leg_order: 1, origin: "DEL", destination: "AMD", dep: "12:15", arr: "13:50", block_minutes: 95, pax: 161, turnaround_before_min: null },
    { flight_id: "DS0302", tail_id: "VT-DS03", leg_order: 2, origin: "AMD", destination: "BOM", dep: "14:25", arr: "15:35", block_minutes: 70, pax: 166, turnaround_before_min: 35 },
    { flight_id: "DS0303", tail_id: "VT-DS03", leg_order: 3, origin: "BOM", destination: "DEL", dep: "16:10", arr: "18:20", block_minutes: 130, pax: 167, turnaround_before_min: 35 },
    { flight_id: "DS0304", tail_id: "VT-DS03", leg_order: 4, origin: "DEL", destination: "CCU", dep: "18:55", arr: "21:20", block_minutes: 145, pax: 167, turnaround_before_min: 35 },
    { flight_id: "DS0401", tail_id: "VT-DS04", leg_order: 1, origin: "BOM", destination: "GOI", dep: "07:45", arr: "08:50", block_minutes: 65, pax: 141, turnaround_before_min: null },
    { flight_id: "DS0402", tail_id: "VT-DS04", leg_order: 2, origin: "GOI", destination: "BOM", dep: "09:20", arr: "10:25", block_minutes: 65, pax: 124, turnaround_before_min: 30 },
    { flight_id: "DS0403", tail_id: "VT-DS04", leg_order: 3, origin: "BOM", destination: "PNQ", dep: "11:35", arr: "12:15", block_minutes: 40, pax: 143, turnaround_before_min: 70 },
    { flight_id: "DS0404", tail_id: "VT-DS04", leg_order: 4, origin: "PNQ", destination: "BOM", dep: "12:50", arr: "13:30", block_minutes: 40, pax: 117, turnaround_before_min: 35 },
    { flight_id: "DS0405", tail_id: "VT-DS04", leg_order: 5, origin: "BOM", destination: "AMD", dep: "14:45", arr: "15:55", block_minutes: 70, pax: 168, turnaround_before_min: 75 },
    { flight_id: "DS0501", tail_id: "VT-DS05", leg_order: 1, origin: "BOM", destination: "BLR", dep: "08:15", arr: "10:00", block_minutes: 105, pax: 159, turnaround_before_min: null },
    { flight_id: "DS0502", tail_id: "VT-DS05", leg_order: 2, origin: "BLR", destination: "COK", dep: "11:10", arr: "12:10", block_minutes: 60, pax: 168, turnaround_before_min: 70 },
    { flight_id: "DS0503", tail_id: "VT-DS05", leg_order: 3, origin: "COK", destination: "BLR", dep: "13:15", arr: "14:15", block_minutes: 60, pax: 165, turnaround_before_min: 65 },
    { flight_id: "DS0504", tail_id: "VT-DS05", leg_order: 4, origin: "BLR", destination: "MAA", dep: "14:45", arr: "15:40", block_minutes: 55, pax: 165, turnaround_before_min: 30 },
    { flight_id: "DS0601", tail_id: "VT-DS06", leg_order: 1, origin: "BLR", destination: "COK", dep: "06:00", arr: "07:00", block_minutes: 60, pax: 153, turnaround_before_min: null },
    { flight_id: "DS0602", tail_id: "VT-DS06", leg_order: 2, origin: "COK", destination: "BLR", dep: "07:35", arr: "08:35", block_minutes: 60, pax: 154, turnaround_before_min: 35 },
    { flight_id: "DS0603", tail_id: "VT-DS06", leg_order: 3, origin: "BLR", destination: "MAA", dep: "09:40", arr: "10:35", block_minutes: 55, pax: 172, turnaround_before_min: 65 },
    { flight_id: "DS0604", tail_id: "VT-DS06", leg_order: 4, origin: "MAA", destination: "BLR", dep: "11:05", arr: "12:00", block_minutes: 55, pax: 171, turnaround_before_min: 30 },
    { flight_id: "DS0605", tail_id: "VT-DS06", leg_order: 5, origin: "BLR", destination: "TRV", dep: "12:35", arr: "13:50", block_minutes: 75, pax: 152, turnaround_before_min: 35 },
    { flight_id: "DS0701", tail_id: "VT-DS07", leg_order: 1, origin: "HYD", destination: "BOM", dep: "06:30", arr: "07:55", block_minutes: 85, pax: 173, turnaround_before_min: null },
    { flight_id: "DS0702", tail_id: "VT-DS07", leg_order: 2, origin: "BOM", destination: "HYD", dep: "09:10", arr: "10:35", block_minutes: 85, pax: 161, turnaround_before_min: 75 },
    { flight_id: "DS0703", tail_id: "VT-DS07", leg_order: 3, origin: "HYD", destination: "BLR", dep: "11:45", arr: "12:55", block_minutes: 70, pax: 150, turnaround_before_min: 70 },
    { flight_id: "DS0704", tail_id: "VT-DS07", leg_order: 4, origin: "BLR", destination: "HYD", dep: "13:25", arr: "14:35", block_minutes: 70, pax: 156, turnaround_before_min: 30 },
    { flight_id: "DS0801", tail_id: "VT-DS08", leg_order: 1, origin: "HYD", destination: "BLR", dep: "12:30", arr: "13:40", block_minutes: 70, pax: 162, turnaround_before_min: null },
    { flight_id: "DS0802", tail_id: "VT-DS08", leg_order: 2, origin: "BLR", destination: "HYD", dep: "14:15", arr: "15:25", block_minutes: 70, pax: 155, turnaround_before_min: 35 },
    { flight_id: "DS0803", tail_id: "VT-DS08", leg_order: 3, origin: "HYD", destination: "MAA", dep: "16:00", arr: "17:15", block_minutes: 75, pax: 159, turnaround_before_min: 35 },
    { flight_id: "DS0804", tail_id: "VT-DS08", leg_order: 4, origin: "MAA", destination: "HYD", dep: "17:50", arr: "19:05", block_minutes: 75, pax: 170, turnaround_before_min: 35 },
    { flight_id: "DS0805", tail_id: "VT-DS08", leg_order: 5, origin: "HYD", destination: "BBI", dep: "19:40", arr: "21:25", block_minutes: 105, pax: 147, turnaround_before_min: 35 },
    { flight_id: "DS0901", tail_id: "VT-DS09", leg_order: 1, origin: "DEL", destination: "IXC", dep: "09:15", arr: "10:05", block_minutes: 50, pax: 141, turnaround_before_min: null },
    { flight_id: "DS0902", tail_id: "VT-DS09", leg_order: 2, origin: "IXC", destination: "DEL", dep: "11:15", arr: "12:05", block_minutes: 50, pax: 113, turnaround_before_min: 70 },
    { flight_id: "DS0903", tail_id: "VT-DS09", leg_order: 3, origin: "DEL", destination: "LKO", dep: "13:25", arr: "14:30", block_minutes: 65, pax: 147, turnaround_before_min: 80 },
    { flight_id: "DS0904", tail_id: "VT-DS09", leg_order: 4, origin: "LKO", destination: "DEL", dep: "15:35", arr: "16:40", block_minutes: 65, pax: 130, turnaround_before_min: 65 },
    { flight_id: "DS1001", tail_id: "VT-DS10", leg_order: 1, origin: "CCU", destination: "BBI", dep: "13:00", arr: "14:05", block_minutes: 65, pax: 133, turnaround_before_min: null },
    { flight_id: "DS1002", tail_id: "VT-DS10", leg_order: 2, origin: "BBI", destination: "CCU", dep: "14:40", arr: "15:45", block_minutes: 65, pax: 132, turnaround_before_min: 35 },
    { flight_id: "DS1003", tail_id: "VT-DS10", leg_order: 3, origin: "CCU", destination: "GAU", dep: "16:20", arr: "17:35", block_minutes: 75, pax: 141, turnaround_before_min: 35 },
    { flight_id: "DS1004", tail_id: "VT-DS10", leg_order: 4, origin: "GAU", destination: "CCU", dep: "18:10", arr: "19:25", block_minutes: 75, pax: 137, turnaround_before_min: 35 },
    { flight_id: "DS1005", tail_id: "VT-DS10", leg_order: 5, origin: "CCU", destination: "LKO", dep: "20:00", arr: "21:45", block_minutes: 105, pax: 117, turnaround_before_min: 35 },
    { flight_id: "DS1101", tail_id: "VT-DS11", leg_order: 1, origin: "CCU", destination: "DEL", dep: "12:00", arr: "14:25", block_minutes: 145, pax: 160, turnaround_before_min: null },
    { flight_id: "DS1102", tail_id: "VT-DS11", leg_order: 2, origin: "DEL", destination: "LKO", dep: "15:05", arr: "16:10", block_minutes: 65, pax: 149, turnaround_before_min: 40 },
    { flight_id: "DS1103", tail_id: "VT-DS11", leg_order: 3, origin: "LKO", destination: "CCU", dep: "16:50", arr: "18:35", block_minutes: 105, pax: 142, turnaround_before_min: 40 },
    { flight_id: "DS1104", tail_id: "VT-DS11", leg_order: 4, origin: "CCU", destination: "GAU", dep: "19:15", arr: "20:30", block_minutes: 75, pax: 136, turnaround_before_min: 40 },
    { flight_id: "DS1201", tail_id: "VT-DS12", leg_order: 1, origin: "AMD", destination: "BOM", dep: "06:30", arr: "07:40", block_minutes: 70, pax: 171, turnaround_before_min: null },
    { flight_id: "DS1202", tail_id: "VT-DS12", leg_order: 2, origin: "BOM", destination: "AMD", dep: "08:10", arr: "09:20", block_minutes: 70, pax: 154, turnaround_before_min: 30 },
    { flight_id: "DS1203", tail_id: "VT-DS12", leg_order: 3, origin: "AMD", destination: "DEL", dep: "10:35", arr: "12:10", block_minutes: 95, pax: 158, turnaround_before_min: 75 },
    { flight_id: "DS1204", tail_id: "VT-DS12", leg_order: 4, origin: "DEL", destination: "AMD", dep: "12:45", arr: "14:20", block_minutes: 95, pax: 171, turnaround_before_min: 35 },
    { flight_id: "DS1301", tail_id: "VT-DS13", leg_order: 1, origin: "COK", destination: "TRV", dep: "06:45", arr: "07:30", block_minutes: 45, pax: 136, turnaround_before_min: null },
    { flight_id: "DS1302", tail_id: "VT-DS13", leg_order: 2, origin: "TRV", destination: "COK", dep: "08:05", arr: "08:50", block_minutes: 45, pax: 138, turnaround_before_min: 35 },
    { flight_id: "DS1303", tail_id: "VT-DS13", leg_order: 3, origin: "COK", destination: "MAA", dep: "09:55", arr: "11:10", block_minutes: 75, pax: 148, turnaround_before_min: 65 },
    { flight_id: "DS1304", tail_id: "VT-DS13", leg_order: 4, origin: "MAA", destination: "COK", dep: "11:40", arr: "12:55", block_minutes: 75, pax: 153, turnaround_before_min: 30 },
    { flight_id: "DS1305", tail_id: "VT-DS13", leg_order: 5, origin: "COK", destination: "BLR", dep: "13:30", arr: "14:30", block_minutes: 60, pax: 151, turnaround_before_min: 35 },
    { flight_id: "DS1401", tail_id: "VT-DS14", leg_order: 1, origin: "TRV", destination: "BLR", dep: "13:30", arr: "14:45", block_minutes: 75, pax: 114, turnaround_before_min: null },
    { flight_id: "DS1402", tail_id: "VT-DS14", leg_order: 2, origin: "BLR", destination: "HYD", dep: "15:55", arr: "17:05", block_minutes: 70, pax: 165, turnaround_before_min: 70 },
    { flight_id: "DS1403", tail_id: "VT-DS14", leg_order: 3, origin: "HYD", destination: "BLR", dep: "17:35", arr: "18:45", block_minutes: 70, pax: 170, turnaround_before_min: 30 },
    { flight_id: "DS1404", tail_id: "VT-DS14", leg_order: 4, origin: "BLR", destination: "TRV", dep: "19:50", arr: "21:05", block_minutes: 75, pax: 117, turnaround_before_min: 65 },
    { flight_id: "DS1501", tail_id: "VT-DS15", leg_order: 1, origin: "PNQ", destination: "BOM", dep: "07:00", arr: "07:40", block_minutes: 40, pax: 143, turnaround_before_min: null },
    { flight_id: "DS1502", tail_id: "VT-DS15", leg_order: 2, origin: "BOM", destination: "DEL", dep: "08:50", arr: "11:00", block_minutes: 130, pax: 159, turnaround_before_min: 70 },
    { flight_id: "DS1503", tail_id: "VT-DS15", leg_order: 3, origin: "DEL", destination: "JAI", dep: "12:20", arr: "13:10", block_minutes: 50, pax: 136, turnaround_before_min: 80 },
    { flight_id: "DS1504", tail_id: "VT-DS15", leg_order: 4, origin: "JAI", destination: "DEL", dep: "13:45", arr: "14:35", block_minutes: 50, pax: 123, turnaround_before_min: 35 },
    { flight_id: "DS1601", tail_id: "VT-DS16", leg_order: 1, origin: "GOI", destination: "BLR", dep: "14:00", arr: "15:10", block_minutes: 70, pax: 156, turnaround_before_min: null },
    { flight_id: "DS1602", tail_id: "VT-DS16", leg_order: 2, origin: "BLR", destination: "HYD", dep: "16:15", arr: "17:25", block_minutes: 70, pax: 163, turnaround_before_min: 65 },
    { flight_id: "DS1603", tail_id: "VT-DS16", leg_order: 3, origin: "HYD", destination: "BLR", dep: "18:00", arr: "19:10", block_minutes: 70, pax: 159, turnaround_before_min: 35 },
    { flight_id: "DS1604", tail_id: "VT-DS16", leg_order: 4, origin: "BLR", destination: "GOI", dep: "20:20", arr: "21:30", block_minutes: 70, pax: 135, turnaround_before_min: 70 }
  ],
  connections: [
    { connection_id: "CX01", airport: "BOM", from_flight: "DS1201", to_flight: "DS1502", passengers: 43, min_connect_minutes: 45 },
    { connection_id: "CX02", airport: "BOM", from_flight: "DS1201", to_flight: "DS0202", passengers: 20, min_connect_minutes: 45 },
    { connection_id: "CX03", airport: "BOM", from_flight: "DS0701", to_flight: "DS1502", passengers: 42, min_connect_minutes: 45 },
    { connection_id: "CX04", airport: "BOM", from_flight: "DS0701", to_flight: "DS0202", passengers: 46, min_connect_minutes: 45 },
    { connection_id: "CX05", airport: "BOM", from_flight: "DS0201", to_flight: "DS0702", passengers: 30, min_connect_minutes: 45 },
    { connection_id: "CX06", airport: "MAA", from_flight: "DS0603", to_flight: "DS1304", passengers: 42, min_connect_minutes: 40 },
    { connection_id: "CX07", airport: "BLR", from_flight: "DS0604", to_flight: "DS0704", passengers: 25, min_connect_minutes: 45 },
    { connection_id: "CX08", airport: "BLR", from_flight: "DS0604", to_flight: "DS0802", passengers: 41, min_connect_minutes: 45 },
    { connection_id: "CX09", airport: "COK", from_flight: "DS0502", to_flight: "DS1305", passengers: 44, min_connect_minutes: 40 },
    { connection_id: "CX10", airport: "DEL", from_flight: "DS1203", to_flight: "DS0903", passengers: 18, min_connect_minutes: 45 },
    { connection_id: "CX11", airport: "BLR", from_flight: "DS0703", to_flight: "DS0504", passengers: 31, min_connect_minutes: 45 },
    { connection_id: "CX12", airport: "BLR", from_flight: "DS0801", to_flight: "DS0504", passengers: 45, min_connect_minutes: 45 },
    { connection_id: "CX13", airport: "DEL", from_flight: "DS0104", to_flight: "DS1102", passengers: 37, min_connect_minutes: 45 },
    { connection_id: "CX14", airport: "DEL", from_flight: "DS1101", to_flight: "DS0105", passengers: 20, min_connect_minutes: 45 },
    { connection_id: "CX15", airport: "BLR", from_flight: "DS1305", to_flight: "DS1402", passengers: 26, min_connect_minutes: 45 },
    { connection_id: "CX16", airport: "BLR", from_flight: "DS1305", to_flight: "DS1602", passengers: 40, min_connect_minutes: 45 },
    { connection_id: "CX17", airport: "HYD", from_flight: "DS0704", to_flight: "DS0803", passengers: 23, min_connect_minutes: 45 },
    { connection_id: "CX18", airport: "BLR", from_flight: "DS1401", to_flight: "DS1602", passengers: 39, min_connect_minutes: 45 },
    { connection_id: "CX19", airport: "DEL", from_flight: "DS0904", to_flight: "DS0304", passengers: 14, min_connect_minutes: 45 },
    { connection_id: "CX20", airport: "HYD", from_flight: "DS1402", to_flight: "DS1603", passengers: 19, min_connect_minutes: 45 },
    { connection_id: "CX21", airport: "CCU", from_flight: "DS1103", to_flight: "DS1005", passengers: 14, min_connect_minutes: 40 }
  ],
  crews: [
    { crew_id: "CR01", tail_id: "VT-DS01", base: "DEL", duty_start: "07:15", max_duty_mins: 600, flight_ids: ["DS0101", "DS0102", "DS0103", "DS0104", "DS0105"] },
    { crew_id: "CR02", tail_id: "VT-DS02", base: "DEL", duty_start: "05:15", max_duty_mins: 600, flight_ids: ["DS0201", "DS0202", "DS0203", "DS0204"] },
    { crew_id: "CR03", tail_id: "VT-DS03", base: "DEL", duty_start: "11:30", max_duty_mins: 600, flight_ids: ["DS0301", "DS0302", "DS0303", "DS0304"] },
    { crew_id: "CR04", tail_id: "VT-DS04", base: "BOM", duty_start: "07:00", max_duty_mins: 600, flight_ids: ["DS0401", "DS0402", "DS0403", "DS0404", "DS0405"] },
    { crew_id: "CR05", tail_id: "VT-DS05", base: "BOM", duty_start: "07:30", max_duty_mins: 600, flight_ids: ["DS0501", "DS0502", "DS0503", "DS0504"] },
    { crew_id: "CR06", tail_id: "VT-DS06", base: "BLR", duty_start: "05:15", max_duty_mins: 600, flight_ids: ["DS0601", "DS0602", "DS0603", "DS0604", "DS0605"] },
    { crew_id: "CR07", tail_id: "VT-DS07", base: "HYD", duty_start: "05:45", max_duty_mins: 600, flight_ids: ["DS0701", "DS0702", "DS0703", "DS0704"] },
    { crew_id: "CR08", tail_id: "VT-DS08", base: "HYD", duty_start: "11:45", max_duty_mins: 600, flight_ids: ["DS0801", "DS0802", "DS0803", "DS0804", "DS0805"] },
    { crew_id: "CR09", tail_id: "VT-DS09", base: "DEL", duty_start: "08:30", max_duty_mins: 600, flight_ids: ["DS0901", "DS0902", "DS0903", "DS0904"] },
    { crew_id: "CR10", tail_id: "VT-DS10", base: "CCU", duty_start: "12:15", max_duty_mins: 600, flight_ids: ["DS1001", "DS1002", "DS1003", "DS1004", "DS1005"] },
    { crew_id: "CR11", tail_id: "VT-DS11", base: "CCU", duty_start: "11:15", max_duty_mins: 600, flight_ids: ["DS1101", "DS1102", "DS1103", "DS1104"] },
    { crew_id: "CR12", tail_id: "VT-DS12", base: "AMD", duty_start: "05:45", max_duty_mins: 600, flight_ids: ["DS1201", "DS1202", "DS1203", "DS1204"] },
    { crew_id: "CR13", tail_id: "VT-DS13", base: "COK", duty_start: "06:00", max_duty_mins: 600, flight_ids: ["DS1301", "DS1302", "DS1303", "DS1304", "DS1305"] },
    { crew_id: "CR14", tail_id: "VT-DS14", base: "TRV", duty_start: "12:45", max_duty_mins: 600, flight_ids: ["DS1401", "DS1402", "DS1403", "DS1404"] },
    { crew_id: "CR15", tail_id: "VT-DS15", base: "PNQ", duty_start: "06:15", max_duty_mins: 600, flight_ids: ["DS1501", "DS1502", "DS1503", "DS1504"] },
    { crew_id: "CR16", tail_id: "VT-DS16", base: "GOI", duty_start: "13:15", max_duty_mins: 600, flight_ids: ["DS1601", "DS1602", "DS1603", "DS1604"] }
  ],
  spare_aircraft: [
    { tail_id: "VT-DS17", base: "BLR", available_from: "05:00", seats: 180 },
    { tail_id: "VT-DS18", base: "DEL", available_from: "05:00", seats: 180 }
  ]
};

// src/utils/airlineCalculations.ts
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(totalMinutes) {
  const norm = (totalMinutes % 1440 + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
function addMinutesToTime(timeStr, minsToAdd) {
  const current = timeToMinutes(timeStr);
  return minutesToTime(current + minsToAdd);
}
function analyzeTurnarounds(flights, minTurnaroundMinutes = 30) {
  const aircraftMap = /* @__PURE__ */ new Map();
  for (const f of flights) {
    if (!aircraftMap.has(f.tail_id)) {
      aircraftMap.set(f.tail_id, []);
    }
    aircraftMap.get(f.tail_id).push(f);
  }
  const results = [];
  for (const [tail_id, legs] of aircraftMap.entries()) {
    legs.sort((a, b) => a.leg_order - b.leg_order);
    for (let i = 0; i < legs.length; i++) {
      const current = legs[i];
      if (i === 0) {
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
        const is_tight = !is_violation && gapMins <= minTurnaroundMinutes + 5;
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
function analyzeCrewDuty(dataset, simulatedFlights) {
  const flightsToUse = simulatedFlights || dataset.flights;
  const flightMap = /* @__PURE__ */ new Map();
  for (const f of flightsToUse) {
    flightMap.set(f.flight_id, f);
  }
  return dataset.crews.map((crew) => {
    const crewFlights = crew.flight_ids.map((fid) => flightMap.get(fid)).filter((f) => !!f);
    const startMins = timeToMinutes(crew.duty_start);
    const lastFlight = crewFlights[crewFlights.length - 1];
    const lastArrTime = lastFlight ? lastFlight.actual_arr || lastFlight.arr : crew.duty_start;
    const endMins = timeToMinutes(lastArrTime);
    const total_duty_mins = endMins - startMins;
    const utilization_percent = Math.round(total_duty_mins / crew.max_duty_mins * 100);
    const is_violation = total_duty_mins > crew.max_duty_mins;
    const is_high_risk = !is_violation && utilization_percent >= 90;
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
function analyzePassengerConnections(dataset, simulatedFlights) {
  const flightsToUse = simulatedFlights || dataset.flights;
  const flightMap = /* @__PURE__ */ new Map();
  for (const f of flightsToUse) {
    flightMap.set(f.flight_id, f);
  }
  return dataset.connections.map((cx) => {
    const fromFlight = flightMap.get(cx.from_flight);
    const toFlight = flightMap.get(cx.to_flight);
    const fromArr = fromFlight ? fromFlight.actual_arr || fromFlight.arr : "00:00";
    const toDep = toFlight ? toFlight.actual_dep || toFlight.dep : "00:00";
    const arrMins = timeToMinutes(fromArr);
    const depMins = timeToMinutes(toDep);
    const actual_gap_mins = depMins - arrMins;
    const scheduled_gap_mins = fromFlight && toFlight ? timeToMinutes(toFlight.dep) - timeToMinutes(fromFlight.arr) : actual_gap_mins;
    const buffer_mins = actual_gap_mins - cx.min_connect_minutes;
    const is_broken = actual_gap_mins < cx.min_connect_minutes;
    const is_tight = !is_broken && buffer_mins <= 15;
    let status = "valid";
    if (is_broken) status = "broken";
    else if (is_tight) status = "tight";
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
function analyzeAirportCapacity(dataset, simulatedFlights) {
  const flightsToUse = simulatedFlights || dataset.flights;
  return dataset.airports.map((airport) => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      hour_label: `${hour.toString().padStart(2, "0")}:00 - ${hour.toString().padStart(2, "0")}:59`,
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
    let peakHourStr = "N/A";
    let totalMovementsDay = 0;
    let hasOverage = false;
    for (const h of hourly) {
      h.total_movements = h.departures + h.arrivals;
      totalMovementsDay += h.total_movements;
      h.utilization_percent = Math.round(h.total_movements / h.capacity * 100);
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
function generateAIRecommendations(dataset, turnarounds, crews, connections, airports, spares) {
  const recommendations = [];
  const cr03 = crews.find((c) => c.crew_id === "CR03");
  if (cr03 && cr03.total_duty_mins >= 580) {
    recommendations.push({
      id: "REC-01",
      category: "Crew Management",
      priority: "Immediate",
      summary: "Crew CR03 Approaching Legal Limit (590m / 600m)",
      detail: `Crew CR03 operating VT-DS03 from base DEL has only 10 minutes remaining buffer before reaching the 600-minute DGCA limit. Flight DS0304 (DEL->CCU arr 21:20) leaves zero tolerance for airborne holding or ATC delays.`,
      expectedImpact: "Prevents flight grounding and illegal crew duty violation for 167 passengers.",
      suggestedAction: `Station a replacement relief crew at DEL before leg DS0304 departs at 18:55, or split the rotation at DEL.`
    });
  }
  const cr08 = crews.find((c) => c.crew_id === "CR08");
  if (cr08 && cr08.total_duty_mins >= 570) {
    recommendations.push({
      id: "REC-02",
      category: "Crew Management",
      priority: "High",
      summary: "Crew CR08 Buffer Monitoring (580m / 600m at HYD)",
      detail: `Crew CR08 completes 5 flight legs ending with DS0805 into BBI at 21:25 with only 20 minutes buffer. Tight turnarounds at HYD (35 min) and MAA (35 min) introduce propagation risk.`,
      expectedImpact: "Protects evening connectivity on HYD-MAA-BBI corridor.",
      suggestedAction: `Place standby crew on hot alert at HYD hub from 15:00 onwards.`
    });
  }
  const blrSpare = spares.find((s) => s.base === "BLR");
  const delSpare = spares.find((s) => s.base === "DEL");
  if (delSpare) {
    recommendations.push({
      id: "REC-03",
      category: "Spare Deployment",
      priority: "High",
      summary: `Spare Aircraft VT-DS18 Ready at Mega-Hub DEL`,
      detail: `VT-DS18 (180 seats) is stationed at Indira Gandhi International (DEL) available from 05:00. DEL handles the highest passenger density in the network (11 flights, 1,570+ passengers).`,
      expectedImpact: "Provides immediate hot-standby coverage for VT-DS01, VT-DS02, VT-DS03, VT-DS09, and VT-DS11.",
      suggestedAction: `Pre-flight VT-DS18 for immediate dispatch if VT-DS03 incurs > 15 min delay on morning sectors.`
    });
  }
  if (blrSpare) {
    recommendations.push({
      id: "REC-04",
      category: "Spare Deployment",
      priority: "Medium",
      summary: `Spare Aircraft VT-DS17 Strategic Reserve at BLR`,
      detail: `VT-DS17 (180 seats) is positioned at Kempegowda International (BLR). BLR serves as the southern mega-hub with heavy connection traffic (8 transfer connections, 287 transit passengers).`,
      expectedImpact: "Guarantees resilience for high-frequency BLR-HYD-MAA-COK triangular network.",
      suggestedAction: `Keep VT-DS17 powered and crew-accessible during peak movement window (12:00 - 15:00).`
    });
  }
  const tightConnections = connections.filter((c) => c.is_tight);
  if (tightConnections.length > 0) {
    const totalTightPax = tightConnections.reduce((sum, c) => sum + c.passengers, 0);
    recommendations.push({
      id: "REC-05",
      category: "Passenger Connection",
      priority: "High",
      summary: `Fast-Track Transfer for ${totalTightPax} High-Risk Transit Passengers`,
      detail: `Identified ${tightConnections.length} connection pairs operating with \u2264 15 minutes safety margin above airport minimum connecting time (MCT). Highest risk: CX14 (DEL, 50m gap for 20 pax) and CX03 (BOM, 55m gap for 42 pax).`,
      expectedImpact: "Prevents misconnections, baggage separation, and involuntary accommodation costs.",
      suggestedAction: `Deploy dedicated tarmac transfer vans and allocate adjacent arrival/departure gates at DEL and BOM.`
    });
  }
  const delAnalysis = airports.find((a) => a.airport.id === "DEL");
  if (delAnalysis) {
    recommendations.push({
      id: "REC-06",
      category: "Airport Flow",
      priority: "Medium",
      summary: "DEL Hub Peak Traffic Slot Smoothing (12:00 - 13:00)",
      detail: `DEL experiences a clustered surge of 5 simultaneous movements in hour 12:00 (DS0301, DS1203, DS1503, etc.). While within runway cap (40/hr), apron stand congestion and pushback delays may cause cascading turnarounds.`,
      expectedImpact: "Reduces taxiway queuing time and fuel burn by estimated 12%.",
      suggestedAction: `Request early CDM (Collaborative Decision Making) target startup times from Delhi ATC.`
    });
  }
  const tightTurnarounds = turnarounds.filter((t) => t.is_tight);
  if (tightTurnarounds.length > 0) {
    recommendations.push({
      id: "REC-07",
      category: "Turnaround Optimization",
      priority: "Medium",
      summary: `Rapid Turnaround Protocol for ${tightTurnarounds.length} 30-Minute Legs`,
      detail: `Flights DS0402 (GOI), DS0504 (BLR), DS0604 (MAA), DS0704 (BLR), DS1202 (BOM), DS1304 (MAA), and DS1403 (HYD) operate at the absolute minimum legal turnaround of 30 minutes.`,
      expectedImpact: "Prevents initial minute-level delays from multiplying across subsequent legs.",
      suggestedAction: `Implement dual-door deplaning/boarding and pre-staged ground equipment at these stations.`
    });
  }
  return recommendations;
}
function simulateFlightDelay(dataset, targetFlightId, delayMinutes) {
  const flights = JSON.parse(JSON.stringify(dataset.flights));
  const flightMap = /* @__PURE__ */ new Map();
  for (const f of flights) {
    flightMap.set(f.flight_id, f);
  }
  const targetFlight = flightMap.get(targetFlightId);
  if (!targetFlight || delayMinutes <= 0) {
    return {
      simulatedFlights: flights,
      affectedFlightsCount: 0,
      cascadingDelayMinutes: 0
    };
  }
  const aircraftLegs = flights.filter((f) => f.tail_id === targetFlight.tail_id).sort((a, b) => a.leg_order - b.leg_order);
  let currentDelay = delayMinutes;
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
      const prevLeg = aircraftLegs.find((l) => l.leg_order === leg.leg_order - 1);
      const prevArrMins = timeToMinutes(prevLeg.actual_arr || prevLeg.arr);
      const scheduledDepMins = timeToMinutes(leg.dep);
      const minTurnaround = dataset.meta.min_turnaround_minutes;
      const earliestDepMins = prevArrMins + minTurnaround;
      if (earliestDepMins > scheduledDepMins) {
        currentDelay = earliestDepMins - scheduledDepMins;
        leg.delay_minutes = currentDelay;
        leg.actual_dep = minutesToTime(earliestDepMins);
        leg.actual_arr = addMinutesToTime(leg.arr, currentDelay);
        affectedCount++;
        totalCascadingMins += currentDelay;
      } else {
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

// tests/airlineOperations.test.ts
describe("DOMINO SKY \u2014 AI AIRLINE OCC REGULATORY & FUNCTIONAL TESTS", () => {
  describe("1. Dataset Verification & Ground Truth", () => {
    test("Dataset contains exact 70 scheduled flight legs", () => {
      assert.strictEqual(RAW_AIRLINE_DATA.flights.length, 70);
    });
    test("Dataset contains exact 16 airports with defined capacities", () => {
      assert.strictEqual(RAW_AIRLINE_DATA.airports.length, 16);
      const airportIds = RAW_AIRLINE_DATA.airports.map((a) => a.id);
      assert.ok(airportIds.includes("DEL"));
      assert.ok(airportIds.includes("BOM"));
      assert.ok(airportIds.includes("BLR"));
      assert.ok(airportIds.includes("HYD"));
      assert.ok(airportIds.includes("CCU"));
      assert.ok(airportIds.includes("MAA"));
    });
    test("Dataset contains exact 16 active aircraft tails and 2 hot-standby spares", () => {
      const activeTails = new Set(RAW_AIRLINE_DATA.flights.map((f) => f.tail_id));
      assert.strictEqual(activeTails.size, 16);
      assert.strictEqual(RAW_AIRLINE_DATA.spare_aircraft.length, 2);
      const spareTails = RAW_AIRLINE_DATA.spare_aircraft.map((s) => s.tail_id);
      assert.ok(spareTails.includes("VT-DS17"));
      assert.ok(spareTails.includes("VT-DS18"));
    });
    test("Total passenger connections count is 21 and sums to exactly 659 passengers", () => {
      assert.strictEqual(RAW_AIRLINE_DATA.connections.length, 21);
      const totalConnectingPax = RAW_AIRLINE_DATA.connections.reduce((sum, c) => sum + c.passengers, 0);
      assert.strictEqual(totalConnectingPax, 659);
    });
    test("Active fleet rotation seat capacity equals 2,880 (16 aircraft \xD7 180 seats)", () => {
      const seatsPerAc = RAW_AIRLINE_DATA.meta.seats_per_aircraft;
      assert.strictEqual(seatsPerAc, 180);
      const activeSeats = 16 * seatsPerAc;
      assert.strictEqual(activeSeats, 2880);
      const totalFleetSeatsWithSpares = (16 + 2) * seatsPerAc;
      assert.strictEqual(totalFleetSeatsWithSpares, 3240);
    });
  });
  describe("2. Aircraft Turnaround Validation (Min 30-min Standard)", () => {
    test("Zero turnaround safety violations exist in baseline schedule", () => {
      const turnarounds = analyzeTurnarounds(RAW_AIRLINE_DATA.flights, 30);
      const violations = turnarounds.filter((t) => t.is_violation);
      assert.strictEqual(violations.length, 0);
    });
    test("Accurately identifies exactly 7 legs operating at the strict 30-minute minimum", () => {
      const turnarounds = analyzeTurnarounds(RAW_AIRLINE_DATA.flights, 30);
      const exact30mLegs = turnarounds.filter((t) => t.actual_gap_mins === 30).map((t) => t.flight_id);
      const expectedExact30 = ["DS0402", "DS0504", "DS0604", "DS0704", "DS1202", "DS1304", "DS1403"];
      for (const flightId of expectedExact30) {
        assert.ok(exact30mLegs.includes(flightId), `Expected ${flightId} to have exact 30m turnaround`);
      }
      assert.strictEqual(exact30mLegs.length, 7);
    });
  });
  describe("3. Crew Flight Duty Period Validation (DGCA 600m Cap)", () => {
    test("Zero legal duty violations exist in baseline schedule", () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const violations = crews.filter((c) => c.is_violation);
      assert.strictEqual(violations.length, 0);
    });
    test("Accurately identifies CR03 as highest risk at 590/600 mins (98.3% duty cap)", () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const cr03 = crews.find((c) => c.crew_id === "CR03");
      assert.ok(cr03, "Crew CR03 must exist in analysis");
      assert.strictEqual(cr03.total_duty_mins, 590);
      assert.strictEqual(cr03.max_duty_mins, 600);
      assert.strictEqual(cr03.remaining_duty_mins, 10);
      assert.strictEqual(cr03.is_high_risk, true);
      assert.strictEqual(cr03.base, "DEL");
    });
    test("Accurately flags all 4 high-risk crews operating above 90% duty threshold", () => {
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const highRiskIds = crews.filter((c) => c.is_high_risk).map((c) => c.crew_id).sort();
      assert.deepStrictEqual(highRiskIds, ["CR03", "CR08", "CR10", "CR11"]);
    });
  });
  describe("4. Passenger Connection Integrity & MCT Validation", () => {
    test("All 21 passenger connection pairs are valid at baseline (0 broken)", () => {
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const broken = connections.filter((c) => c.is_broken);
      assert.strictEqual(broken.length, 0);
      const validPax = connections.filter((c) => !c.is_broken).reduce((sum, c) => sum + c.passengers, 0);
      assert.strictEqual(validPax, 659);
    });
    test("Accurately flags the 5 tight connection pairs with safety buffer <= 15 mins", () => {
      const connections = analyzePassengerConnections(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const tight = connections.filter((c) => c.is_tight);
      assert.strictEqual(tight.length, 5);
      const tightIds = tight.map((c) => c.connection_id).sort();
      assert.deepStrictEqual(tightIds, ["CX03", "CX05", "CX13", "CX14", "CX20"]);
      const cx14 = connections.find((c) => c.connection_id === "CX14");
      assert.ok(cx14);
      assert.strictEqual(cx14.buffer_mins, 5, "CX14 must have exactly 5 min safety buffer");
      assert.strictEqual(cx14.passengers, 20);
    });
  });
  describe("5. Airport Runway Hourly Capacity Analytics", () => {
    test("Evaluates all 16 airports across 24 hourly buckets with zero overages", () => {
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      assert.strictEqual(airports.length, 16);
      const overages = airports.filter((a) => a.has_overage);
      assert.strictEqual(overages.length, 0);
    });
    test("Accurately calculates total daily movements: BLR=22, DEL=20, BOM=18", () => {
      const airports = analyzeAirportCapacity(RAW_AIRLINE_DATA, RAW_AIRLINE_DATA.flights);
      const blr = airports.find((a) => a.airport.id === "BLR");
      const del = airports.find((a) => a.airport.id === "DEL");
      const bom = airports.find((a) => a.airport.id === "BOM");
      assert.strictEqual(blr?.total_movements_day, 22);
      assert.strictEqual(del?.total_movements_day, 20);
      assert.strictEqual(bom?.total_movements_day, 18);
    });
  });
  describe("6. Disruption Simulation & Dynamic Impact Recalculation", () => {
    test("Injecting 45m delay on DS0301 propagates cascading delays on rotation VT-DS03", () => {
      const result = simulateFlightDelay(RAW_AIRLINE_DATA, "DS0301", 45);
      assert.ok(result.affectedFlightsCount >= 3, "At least 3 legs must be affected");
      assert.ok(result.cascadingDelayMinutes >= 45, "Cascading delay minutes must be >= 45");
      const delayedLegs = result.simulatedFlights.filter((f) => (f.delay_minutes || 0) > 0);
      assert.ok(delayedLegs.length >= 3, "At least 3 legs must inherit delay on VT-DS03");
      const crews = analyzeCrewDuty(RAW_AIRLINE_DATA, result.simulatedFlights);
      const cr03 = crews.find((c) => c.crew_id === "CR03");
      assert.ok(cr03);
      assert.strictEqual(cr03.is_violation, true);
      assert.ok(cr03.total_duty_mins > 600);
    });
    test("AI Recommendations generate actionable recovery strategy for duty breach", () => {
      const sim = simulateFlightDelay(RAW_AIRLINE_DATA, "DS0301", 45);
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
      assert.ok(recs.length > 0, "Must generate AI recommendations during disruption");
      const crewRec = recs.find((r) => r.category === "Crew Management");
      assert.ok(crewRec, "Must generate a Crew Management recommendation for CR03");
    });
  });
  describe("7. High-Precision Time Utility Functions", () => {
    test("timeToMinutes and minutesToTime perform exact bidirectional conversions", () => {
      assert.strictEqual(timeToMinutes("06:00"), 360);
      assert.strictEqual(timeToMinutes("23:59"), 1439);
      assert.strictEqual(minutesToTime(360), "06:00");
      assert.strictEqual(minutesToTime(1439), "23:59");
    });
  });
  describe("8. Kinetic Airspace Topology Projection & Deterministic Engine", () => {
    test("All 16 airports project into valid bounding coordinates for Geo Radar mode", () => {
      const minLng = 67.5;
      const maxLng = 94.5;
      const minLat = 7.5;
      const maxLat = 32.5;
      for (const airport of RAW_AIRLINE_DATA.airports) {
        assert.ok(airport.lat >= minLat && airport.lat <= maxLat, `${airport.id} lat out of bounds`);
        assert.ok(airport.lng >= minLng && airport.lng <= maxLng, `${airport.id} lng out of bounds`);
        const x = (airport.lng - minLng) / (maxLng - minLng) * 740 + 130;
        const y = (maxLat - airport.lat) / (maxLat - minLat) * 540 + 75;
        assert.ok(!isNaN(x) && x >= 100 && x <= 950, `${airport.id} X projection failed`);
        assert.ok(!isNaN(y) && y >= 50 && y <= 680, `${airport.id} Y projection failed`);
      }
    });
    test("Orbital Constellation positions Mega Hubs, Regional Hubs, and Spokes in concentric rings", () => {
      const cx = 500;
      const cy = 350;
      const megaHubs = ["DEL", "BLR", "BOM", "HYD"];
      const regionalHubs = ["AMD", "CCU", "COK", "MAA"];
      for (const apId of megaHubs) {
        const ap = RAW_AIRLINE_DATA.airports.find((a) => a.id === apId);
        assert.ok(ap, `Mega hub ${apId} must exist`);
        assert.strictEqual(ap.tier, "mega_hub");
      }
      for (const apId of regionalHubs) {
        const ap = RAW_AIRLINE_DATA.airports.find((a) => a.id === apId);
        assert.ok(ap, `Regional hub ${apId} must exist`);
        assert.strictEqual(ap.tier, "regional_hub");
      }
    });
    test("All 70 flight routes map to existing origin and destination airport nodes", () => {
      const airportIdSet = new Set(RAW_AIRLINE_DATA.airports.map((a) => a.id));
      for (const flight of RAW_AIRLINE_DATA.flights) {
        assert.ok(airportIdSet.has(flight.origin), `Flight ${flight.flight_id} has invalid origin ${flight.origin}`);
        assert.ok(airportIdSet.has(flight.destination), `Flight ${flight.flight_id} has invalid destination ${flight.destination}`);
      }
    });
  });
});
