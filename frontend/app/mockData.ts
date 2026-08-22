/* ───────────────────────────────────────────
   TYPE DEFINITIONS
   ─────────────────────────────────────────── */

export type JOStatus = "New" | "Work in progress" | "Job completed";

export interface MaterialRequirement {
  name: string;
  qty: number;
}

export interface InspectionItem {
  name: string;
  status: "GOOD" | "ISSUE" | "MONITOR" | "PENDING";
  mechanicNote?: string;
  photoUrl?: string;
  photos?: string[];
  statusPhotos?: {
    GOOD?: string[];
    ISSUE?: string[];
    MONITOR?: string[];
  };
  statusNotes?: {
    GOOD?: string;
    ISSUE?: string;
    MONITOR?: string;
  };
  requiredMaterials?: (string | MaterialRequirement)[];
}

export interface EstimateLineItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  customerApproved: boolean | null; // null = not yet decided
}

export interface JobOrder {
  id: string;
  ownerName: string;
  ownerPhone: string;
  ownerFb: string;
  vehicleModel: string;
  plateNumber: string;
  engineType: string;
  odometer: string;
  serviceType: string;
  serviceDescription?: string;
  inchargeMechanics: string[];
  status: JOStatus;
  createdAt: string;
  vehiclePhotoUrl?: string;
  // Post-inspection data
  inspectionItems?: InspectionItem[];
  mechanicFindings?: string;
  estimateItems?: EstimateLineItem[];
  discount?: number;
  estimateComment?: string;
}



/* ─── MOCK JOB ORDERS CONSTANT ─── */
  export const DEFAULT_JOB_ORDERS: JobOrder[] = [
    {
      id: "JO-1041",
      ownerName: "Maria Santos",
      ownerPhone: "0918-444-5678",
      ownerFb: "@mariasantos",
      vehicleModel: "Mitsubishi Montero 2020",
      plateNumber: "XYZ 8888",
      engineType: "Diesel",
      odometer: "62,400 KM",
      serviceType: "Major / Full PMS",
      inchargeMechanics: ["Mark Rey", "John Uy"],
      status: "Work in progress",
      createdAt: "Today, 11:30 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        {
          name: "Air Filter",
          status: "ISSUE",
          mechanicNote: "Air filter clogged with dirt, needs replacement",
          requiredMaterials: [{ name: "Air Filter", qty: 2 }]
        },
        {
          name: "Replace spark plugs",
          status: "ISSUE",
          mechanicNote: "Worn out, misfiring on cylinder 3",
          requiredMaterials: [{ name: "Spark Plugs (NGK Iridium)", qty: 4 }]
        },
        {
          name: "Replace brake fluid",
          status: "MONITOR",
          mechanicNote: "Fluid dark, contaminated",
          requiredMaterials: [{ name: "Brake Fluid (DOT4 1L)", qty: 1 }]
        },
        {
          name: "Replace transmission fluid (manual/AT/CVT)",
          status: "ISSUE",
          mechanicNote: "Burnt smell, needs full flush",
          requiredMaterials: [{ name: "Transmission Fluid (ATF 1L)", qty: 3 }]
        },
        { name: "Replace coolant (radiator flush)", status: "GOOD" },
        { name: "Replace fuel filter (if applicable)", status: "GOOD" },
        { name: "Check timing belt or chain condition", status: "MONITOR", mechanicNote: "Minor fraying, replace within 10k km" },
        {
          name: "Clean EGR valve/intake manifold (diesel cars)",
          status: "ISSUE",
          mechanicNote: "Heavy carbon buildup",
          requiredMaterials: [{ name: "EGR Cleaner Spray", qty: 1 }]
        },
        { name: "Deep diagnostic scan", status: "GOOD" },
        { name: "Test battery load capacity", status: "GOOD" },
        { name: "Full vehicle road test", status: "GOOD" }
      ],
      mechanicFindings: "Brake pads worn at 20%, recommend replacement. Minor oil leak near valve cover gasket. Spark plugs misfiring on cylinder 3. Transmission fluid burnt — full flush recommended.",
      estimateItems: [
        { id: "E1", description: "Spark Plugs (NGK Iridium)", qty: 4, unitPrice: 350, customerApproved: true },
        { id: "E2", description: "Brake Fluid (DOT4 1L)", qty: 1, unitPrice: 450, customerApproved: true },
        { id: "E3", description: "Transmission Fluid (ATF)", qty: 3, unitPrice: 800, customerApproved: null },
        { id: "E4", description: "EGR Valve Cleaning Kit", qty: 1, unitPrice: 1200, customerApproved: null }
      ],
      discount: 500
    },
    {
      id: "JO-1042",
      ownerName: "Juan Dela Cruz",
      ownerPhone: "0917-555-1234",
      ownerFb: "@juandelacruz",
      vehicleModel: "Toyota Vios 2018",
      plateNumber: "ABC 1234",
      engineType: "Gasoline",
      odometer: "45,210 KM",
      serviceType: "Basic PMS",
      inchargeMechanics: ["Rodel Santos"],
      status: "New",
      createdAt: "Today, 10:15 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "PENDING" },
        { name: "Inspect air filter & cabin filter", status: "PENDING" },
        { name: "Check brake pads & fluid levels", status: "PENDING" },
        { name: "Tire pressure & tread inspection", status: "PENDING" },
        { name: "Battery load test & terminal cleaning", status: "PENDING" }
      ]
    },
    {
      id: "JO-1045",
      ownerName: "Cedrick Tan",
      ownerPhone: "0917-777-8888",
      ownerFb: "@cedricktan",
      vehicleModel: "Nissan Navara 2022",
      plateNumber: "NBD 4421",
      engineType: "Diesel",
      odometer: "28,600 KM",
      serviceType: "Major / Full PMS",
      inchargeMechanics: ["Bernard Caermare"],
      status: "New",
      createdAt: "Today, 8:30 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Includes everything from Basic and Intermediate Services", status: "PENDING" },
        { name: "Replace spark plugs", status: "PENDING" },
        { name: "Replace brake fluid", status: "PENDING" },
        { name: "Replace transmission fluid (manual/AT/CVT)", status: "PENDING" },
        { name: "Replace coolant (radiator flush)", status: "PENDING" }
      ]
    },
    // READY FOR PICKUP MOCKUPS
    {
      id: "JO-1038",
      ownerName: "Carlos Reyes",
      ownerPhone: "0920-333-9999",
      ownerFb: "@carlosreyes",
      vehicleModel: "Honda Civic 2019",
      plateNumber: "NMO 5678",
      engineType: "Gasoline",
      odometer: "54,200 KM",
      serviceType: "Basic PMS",
      inchargeMechanics: ["Mark Rey", "Rey Duran"],
      status: "Job completed",
      createdAt: "Today, 9:15 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        { name: "Inspect air filter & cabin filter", status: "GOOD" },
        { name: "Check brake pads & fluid levels", status: "GOOD" },
        { name: "Tire pressure & tread inspection", status: "GOOD" },
        { name: "Battery load test & terminal cleaning", status: "GOOD" }
      ],
      mechanicFindings: "All inspection items passed. Engine running smooth, brake pads at 85%.",
      estimateItems: [
        { id: "E101", description: "Engine Oil & Filter Change", qty: 1, unitPrice: 1800, customerApproved: true }
      ]
    },
    {
      id: "JO-1037",
      ownerName: "Ana Lim",
      ownerPhone: "0917-111-2222",
      ownerFb: "@analim",
      vehicleModel: "Ford Ranger 2021",
      plateNumber: "RNG 9988",
      engineType: "Diesel",
      odometer: "38,500 KM",
      serviceType: "Change Oil & Brake Check",
      inchargeMechanics: ["John Uy"],
      status: "Job completed",
      createdAt: "Yesterday, 2:45 PM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        { name: "Inspect air filter & cabin filter", status: "GOOD" },
        { name: "Check brake pads & fluid levels", status: "GOOD" }
      ],
      mechanicFindings: "Oil and filter replaced. Brake fluid level topped up.",
      estimateItems: [
        { id: "E201", description: "Fully Synthetic Diesel Oil (7L)", qty: 7, unitPrice: 450, customerApproved: true },
        { id: "E202", description: "Oil Filter Assembly", qty: 1, unitPrice: 650, customerApproved: true }
      ]
    },
    // JOB COMPLETED MOCKUPS
    {
      id: "JO-1036",
      ownerName: "Bong Go",
      ownerPhone: "0919-888-7777",
      ownerFb: "@bonggo",
      vehicleModel: "Toyota Fortuner 2021",
      plateNumber: "NKN 9999",
      engineType: "Diesel",
      odometer: "68,400 KM",
      serviceType: "Heavy PMS Refresh",
      inchargeMechanics: ["Bernard Caermare", "Roderick Omisol"],
      status: "Job completed",
      createdAt: "Yesterday, 10:00 AM",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Complete engine overhaul inspection", status: "GOOD" },
        { name: "Suspension & underchassis bushing overhaul", status: "GOOD" },
        { name: "Aircon system deep clean & freon recharge", status: "GOOD" }
      ],
      mechanicFindings: "Heavy PMS completed successfully. All suspension bushings replaced and aircon servicing done.",
      estimateItems: [
        { id: "E301", description: "Heavy PMS Overhaul Package", qty: 1, unitPrice: 12500, customerApproved: true }
      ]
    },
    {
      id: "JO-1035",
      ownerName: "Vicente Sotto",
      ownerPhone: "0919-222-3333",
      ownerFb: "@vicesotto",
      vehicleModel: "Toyota Wigo 2021",
      plateNumber: "NGA 5521",
      engineType: "Gasoline",
      odometer: "22,100 KM",
      serviceType: "Basic PMS",
      inchargeMechanics: ["Rodel Santos"],
      status: "Job completed",
      createdAt: "2 days ago",
      vehiclePhotoUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80",
      inspectionItems: [
        { name: "Change engine oil & filter", status: "GOOD" },
        { name: "Inspect air filter & cabin filter", status: "GOOD" },
        { name: "Check brake pads & fluid levels", status: "GOOD" }
      ],
      mechanicFindings: "Basic PMS completed. Vehicle picked up by owner.",
      estimateItems: [
        { id: "E401", description: "Basic PMS Package", qty: 1, unitPrice: 3850, customerApproved: true }
      ]
    }
  ];

/* ─── MOCK OWNERS ─── */
export const DEFAULT_OWNERS = [
  { id: "OWN-101", name: "Juan Dela Cruz", phone: "0917-555-1234", fb_handle: "@juandelacruz", email: "juan@example.com" },
  { id: "OWN-102", name: "Maria Santos", phone: "0918-444-5678", fb_handle: "@mariasantos", email: "maria@example.com" },
  { id: "OWN-103", name: "Carlos Reyes", phone: "0920-333-9999", fb_handle: "@carlosreyes", email: "carlos@example.com" },
  { id: "OWN-104", name: "Ana Lim", phone: "0917-111-2222", fb_handle: "@analim", email: "ana@example.com" },
  { id: "OWN-105", name: "Cedrick Tan", phone: "0917-777-8888", fb_handle: "@cedricktan", email: "cedrick@example.com" },
  { id: "OWN-106", name: "Bong Go", phone: "0919-888-7777", fb_handle: "@bonggo", email: "bong@example.com" },
  { id: "OWN-107", name: "Vicente Sotto", phone: "0919-222-3333", fb_handle: "@vicesotto", email: "vicente@example.com" }
];

/* ─── MOCK VEHICLES ─── */
export const DEFAULT_VEHICLES = [
  { id: 1, owner_id: "OWN-101", owner_name: "Juan Dela Cruz", model: "Toyota Vios 2018", plate_number: "ABC 1234", engine_type: "Gasoline" },
  { id: 2, owner_id: "OWN-102", owner_name: "Maria Santos", model: "Mitsubishi Montero 2020", plate_number: "XYZ 8888", engine_type: "Diesel" },
  { id: 3, owner_id: "OWN-103", owner_name: "Carlos Reyes", model: "Honda Civic 2019", plate_number: "NMO 5678", engine_type: "Gasoline" },
  { id: 4, owner_id: "OWN-104", owner_name: "Ana Lim", model: "Ford Ranger 2021", plate_number: "RNG 9988", engine_type: "Diesel" },
  { id: 5, owner_id: "OWN-105", owner_name: "Cedrick Tan", model: "Nissan Navara 2022", plate_number: "NBD 4421", engine_type: "Diesel" },
  { id: 6, owner_id: "OWN-106", owner_name: "Bong Go", model: "Toyota Fortuner 2021", plate_number: "NKN 9999", engine_type: "Diesel" },
  { id: 7, owner_id: "OWN-107", owner_name: "Vicente Sotto", model: "Toyota Wigo 2021", plate_number: "NGA 5521", engine_type: "Gasoline" }
];

/* ─── MOCK MECHANICS ─── */
export const DEFAULT_MECHANICS = [
  { id: 1, name: "Mark Rey", role: "Senior Mechanic", status: "AVAILABLE" },
  { id: 2, name: "John Uy", role: "Mechanic", status: "AVAILABLE" },
  { id: 3, name: "Rodel Santos", role: "Lead Mechanic", status: "AVAILABLE" },
  { id: 4, name: "Bernard Caermare", role: "Master Technician", status: "AVAILABLE" },
  { id: 5, name: "Rey Duran", role: "Junior Mechanic", status: "AVAILABLE" },
  { id: 6, name: "Roderick Omisol", role: "Electrical Specialist", status: "AVAILABLE" }
];

/* ─── MOCK MATERIALS ─── */
export const DEFAULT_MATERIALS = [
  { id: 1, name: "Engine Oil Fully Synthetic (1L)", category: "Oils & Fluids", stock_qty: 45, unit_of_measure: "Liters", cost_price: 350, selling_price: 500, cabinet_code: "CAB-A1", critical_threshold: 10, compatible_vehicles: ["All Gasoline & Diesel"] },
  { id: 2, name: "Brake Fluid DOT4 (1L)", category: "Oils & Fluids", stock_qty: 18, unit_of_measure: "Liters", cost_price: 250, selling_price: 450, cabinet_code: "CAB-A2", critical_threshold: 5, compatible_vehicles: ["Universal"] },
  { id: 3, name: "Spark Plugs (NGK Iridium)", category: "Ignition Parts", stock_qty: 32, unit_of_measure: "Pcs", cost_price: 200, selling_price: 350, cabinet_code: "CAB-B1", critical_threshold: 8, compatible_vehicles: ["Toyota", "Honda", "Nissan"] },
  { id: 4, name: "Oil Filter Assembly", category: "Filters", stock_qty: 25, unit_of_measure: "Pcs", cost_price: 300, selling_price: 650, cabinet_code: "CAB-C1", critical_threshold: 5, compatible_vehicles: ["Toyota Vios", "Ford Ranger"] },
  { id: 5, name: "Transmission Fluid (ATF 1L)", category: "Oils & Fluids", stock_qty: 12, unit_of_measure: "Liters", cost_price: 500, selling_price: 800, cabinet_code: "CAB-A3", critical_threshold: 4, compatible_vehicles: ["Automatic Transmission Vehicles"] },
  { id: 6, name: "EGR Cleaner Spray", category: "Chemicals", stock_qty: 8, unit_of_measure: "Cans", cost_price: 700, selling_price: 1200, cabinet_code: "CAB-D1", critical_threshold: 3, compatible_vehicles: ["Diesel Vehicles"] }
];