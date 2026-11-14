export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'Driver' | 'Owner';
  phone?: string;
  tractorModel?: string;
  licenseNumber?: string;
}

export interface Bill {
  _id?: string;
  id?: string;
  billId: string;
  customerName: string;
  customerPhone: string;
  driverName: string;
  workType: string;
  variant?: string;
  durationSecs: number;
  durationFormatted: string;
  ratePerHour: number;
  totalAmount: number;
  status: 'Paid' | 'Pending';
  notes?: string;
  season?: string;
  location?: string;
  date: string;
  createdAt?: string;
}

export interface MonthlyDataPoint {
  month: string;
  revenue: number;
  hours: number;
}

export interface WorkTypeDataPoint {
  name: string;
  count: number;
  revenue: number;
}

export interface PaymentDistributionPoint {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface Stats {
  totalRevenue: number;
  totalHours: number;
  pendingDues: number;
  completedJobs: number;
  paidCount: number;
  pendingCount: number;
  monthlyData: MonthlyDataPoint[];
  workTypeBreakdown: WorkTypeDataPoint[];
  paymentStatusDistribution: PaymentDistributionPoint[];
}

export interface Driver {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  licenseNumber: string;
  assignedTractor: string;
  experienceYears?: number;
  hourlyWage?: number;
  dailyWage?: number;
  status: 'Active' | 'On Duty' | 'Available' | 'Inactive';
  address?: string;
  specialty?: string[];
  totalTrips?: number;
  totalHours?: number;
  joinedDate?: string;
  ownerEmail?: string;
}

export interface ActiveTractorConfig {
  registrationNumber: string;
  model: string;
  driverName: string;
  status: 'Active' | 'Maintenance' | 'Idle';
  currentHours?: number;
  nextServiceHours?: number;
  dieselLevelPercent?: number;
}

export interface TractorServiceConfig {
  serviceName: string;
  tagline: string;
  phone: string;
  location: string;
  customerDescription: string;
  gstin?: string;
}

export interface ActiveTractorSession {
  isRunning: boolean;
  startTimestamp: number | null;
  accumulatedSeconds: number;
  customerName: string;
  customerPhone: string;
  selectedWork: string;
  selectedTines: string;
  hourlyRate: number;
  season: string;
  location: string;
  driverName: string;
  fieldNotes: string;
  paymentStatus: 'Paid' | 'Pending';
  autoSendCustomer: boolean;
  manualHours: string;
  manualMins: string;
  lastUpdated: number;
}

export type ActiveTab = 'billing' | 'manual-bill' | 'history' | 'analytics' | 'profile' | 'drivers' | 'settings' | 'loader' | 'owner-dashboard';
