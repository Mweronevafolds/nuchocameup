export interface DeliveryPoint {
  id: string;
  name: string;
  location: string;
  fee: number;
}

export const PICKUP_POINTS: DeliveryPoint[] = [
  { id: "pum-cbd-1",   name: "Imenti House",       location: "Nairobi CBD", fee: 100 },
  { id: "pum-cbd-2",   name: "Archives",           location: "Nairobi CBD", fee: 100 },
  { id: "pum-west",    name: "Westlands Mall",     location: "Westlands",   fee: 150 },
  { id: "pum-ngong",   name: "The Hub",            location: "Ngong Road",  fee: 150 },
  { id: "pum-kilimani", name: "Yaya Center",        location: "Kilimani",    fee: 150 },
  { id: "pum-thika",   name: "Garden City",        location: "Thika Road",  fee: 200 },
  { id: "pum-embakasi", name: "Fedha Estate",       location: "Embakasi",    fee: 200 },
  { id: "pum-langata", name: "T-Mall",             location: "Langata",     fee: 150 },
];
