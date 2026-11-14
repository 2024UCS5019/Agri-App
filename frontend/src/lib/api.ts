import { ActiveTractorConfig, Bill, Driver, Stats, TractorServiceConfig, User } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fallback mock storage in browser localStorage if backend is standalone
export const getLocalSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('agri_token');
  const raw = localStorage.getItem('agri_user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setLocalSession = (user: User, token?: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('agri_user', JSON.stringify(user));
  if (token) localStorage.setItem('agri_token', token);
};

export const clearLocalSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('agri_user');
  localStorage.removeItem('agri_token');
  localStorage.removeItem('agri_auth_mode');
};

export const getLocalToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('agri_token');
};

// ── Auth API ──
export const authAPI = {
  async signup(data: { name: string; email: string; password: string; role?: string; phone?: string; tractorModel?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      // Account created: do NOT auto-login, require sign in with password
      return result;
    } catch {
      // Local fallback
      const user: User = {
        name: data.name,
        email: data.email,
        role: (data.role as User['role']) || 'Driver',
        phone: data.phone || '+91 98765 43210',
        tractorModel: data.tractorModel || 'Mahindra 575 DI Sarpanch',
        licenseNumber: 'TN-28-2022-0098234',
      };
      try {
        const registered = JSON.parse(localStorage.getItem('agri_registered_users') || '[]');
        const idx = registered.findIndex((u: User) => u.email.toLowerCase() === data.email.toLowerCase());
        if (idx >= 0) {
          registered[idx] = { ...user, password: data.password };
        } else {
          registered.push({ ...user, password: data.password });
        }
        localStorage.setItem('agri_registered_users', JSON.stringify(registered));
      } catch {
        // ignore
      }
      return { success: true, user, message: 'Account registered successfully! Please sign in.' };
    }
  },

  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (res.ok && result.user) {
        setLocalSession(result.user, result.token);
      }
      return result;
    } catch {
      // 1. Check newly registered users in localStorage first
      try {
        const registered = JSON.parse(localStorage.getItem('agri_registered_users') || '[]');
        const found = registered.find(
          (u: User & { password?: string }) =>
            u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (found) {
          const userObj: User = {
            name: found.name,
            email: found.email,
            role: found.role,
            phone: found.phone,
            tractorModel: found.tractorModel,
            licenseNumber: found.licenseNumber,
          };
          setLocalSession(userObj, 'local_dev_token');
          return { success: true, user: userObj, message: 'Authenticated successfully' };
        }
      } catch {
        // ignore
      }

      // 2. Demo credentials check
      if (email.toLowerCase() === 'muthu.driver@agri.in' && (password === 'password123' || password === '123456')) {
        const defaultUser: User = {
          name: 'Muthu',
          email,
          role: 'Driver',
          phone: '+91 94433 11223',
          tractorModel: 'Mahindra 575 DI Sarpanch',
          licenseNumber: 'TN-28-2022-0098234',
        };
        setLocalSession(defaultUser, 'local_dev_token');
        return { success: true, user: defaultUser };
      }

      if (email.toLowerCase() === 'owner.shanmugam@agri.in' && (password === 'password123' || password === '123456')) {
        const ownerUser: User = {
          name: 'Shanmugam (Owner)',
          email,
          role: 'Owner',
          phone: '+91 94433 88123',
          tractorModel: 'Mahindra 575 DI Sarpanch',
          licenseNumber: 'TN-28-2020-0012934',
        };
        setLocalSession(ownerUser, 'local_dev_token');
        return { success: true, user: ownerUser };
      }

      return { success: false, message: 'Invalid email or password. Please verify credentials.' };
    }
  },

  async googleAuth(name: string, email: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email }),
      });
      const result = await res.json();
      if (res.ok && result.user) {
        setLocalSession(result.user, result.token);
      }
      return result;
    } catch {
      const user: User = {
        name,
        email,
        role: 'Owner',
        phone: '+91 94433 88123',
        tractorModel: 'Mahindra 575 DI Sarpanch',
        licenseNumber: 'TN-28-2022-0098234',
      };
      setLocalSession(user, 'google_mock_token');
      return { success: true, user };
    }
  },

  async getMe(): Promise<User | null> {
    try {
      const token = getLocalToken();
      if (!token) {
        return null;
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const result = await res.json();
        if (result.user) {
          setLocalSession(result.user, token);
          return result.user;
        }
      }
      return getLocalSession();
    } catch {
      return getLocalSession();
    }
  },

  async updateProfile(data: Partial<User>) {
    try {
      const token = getLocalToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.user) {
        setLocalSession(result.user);
      }
      return result;
    } catch {
      const current = getLocalSession() || {
        name: 'Muthu',
        email: 'muthu.driver@agrifleet.in',
        role: 'Driver',
      };
      const updated = { ...current, ...data };
      setLocalSession(updated);
      return { success: true, user: updated, message: 'Profile updated locally' };
    }
  },

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    clearLocalSession();
  },
};

// ── Bills API ──
export const billsAPI = {
  async getAll(params?: { search?: string; workType?: string; status?: string; driverName?: string }): Promise<Bill[]> {
    try {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.workType) q.set('workType', params.workType);
      if (params?.status) q.set('status', params.status);
      if (params?.driverName) q.set('driverName', params.driverName);

      const res = await fetch(`${API_BASE_URL}/bills?${q.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        return data.bills || [];
      }
      return getLocalBills();
    } catch {
      return getLocalBills();
    }
  },

  async create(bill: Omit<Bill, 'billId' | 'date'> & { billId?: string; date?: string }): Promise<Bill> {
    try {
      const res = await fetch(`${API_BASE_URL}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bill),
      });
      if (res.ok) {
        const data = await res.json();
        return data.bill;
      }
      return saveLocalBill(bill);
    } catch {
      return saveLocalBill(bill);
    }
  },

  async toggleStatus(id: string, status?: 'Paid' | 'Pending'): Promise<Bill | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/bills/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.bill;
      }
      return toggleLocalBill(id, status);
    } catch {
      return toggleLocalBill(id, status);
    }
  },

  async updateNotes(id: string, notes: string): Promise<Bill | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/bills/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        const data = await res.json();
        updateLocalBillNote(id, notes);
        return data.bill;
      }
      return updateLocalBillNote(id, notes);
    } catch {
      return updateLocalBillNote(id, notes);
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/bills/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) return true;
      return deleteLocalBill(id);
    } catch {
      return deleteLocalBill(id);
    }
  },

  async getStats(driverName?: string): Promise<Stats> {
    try {
      const q = driverName ? `?driverName=${encodeURIComponent(driverName)}` : '';
      const res = await fetch(`${API_BASE_URL}/bills/stats${q}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        return data.stats;
      }
      return computeLocalStats();
    } catch {
      return computeLocalStats();
    }
  },
};

// ── LocalStorage Helpers ──
function getLocalBills(): Bill[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('agri_bills');
  if (raw) {
    try {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let changed = false;
        parsed = parsed.map((bill: Bill) => {
          const updated = { ...bill };
          if (typeof updated.date === 'string' && updated.date.includes('2026')) {
            updated.date = updated.date.replace(/[\s\-/]?2026/g, '').trim();
            changed = true;
          }
          if (typeof updated.billId === 'string' && updated.billId.includes('2026')) {
            updated.billId = updated.billId.replace(/[-_]?2026/g, '');
            changed = true;
          }
          return updated;
        });
        if (changed) {
          localStorage.setItem('agri_bills', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {
      // Fallback to default
    }
  }

  const defaultBills: Bill[] = [
    {
      _id: 'b1',
      billId: '#INV-89101',
      customerName: 'Ramesh Kumar',
      customerPhone: '+91 94433 11223',
      driverName: 'Muthu',
      workType: 'Rotavator',
      variant: '',
      durationSecs: 7800,
      durationFormatted: '2h 10m',
      ratePerHour: 900,
      totalAmount: 1950,
      status: 'Paid',
      notes: 'South Acre Paddy field ploughed',
      date: '28 Oct',
    },
    {
      _id: 'b2',
      billId: '#INV-89102',
      customerName: 'Murugan G',
      customerPhone: '+91 98421 55678',
      driverName: 'Muthu',
      workType: 'Spring Cultivator',
      variant: '9 Tines',
      durationSecs: 10800,
      durationFormatted: '3h 00m',
      ratePerHour: 850,
      totalAmount: 2550,
      status: 'Pending',
      notes: 'Sugarcane preparatory tillage',
      date: '27 Oct',
    },
    {
      _id: 'b3',
      billId: '#INV-89103',
      customerName: 'Senthil Farm',
      customerPhone: '+91 97500 88990',
      driverName: 'Muthu',
      workType: 'Disc Cultivator',
      variant: '',
      durationSecs: 5400,
      durationFormatted: '1h 30m',
      ratePerHour: 950,
      totalAmount: 1425,
      status: 'Paid',
      notes: 'Red soil high-torque plot',
      date: '26 Oct',
    },
    {
      _id: 'b4',
      billId: '#INV-89104',
      customerName: 'Kavitha S',
      customerPhone: '+91 94871 22334',
      driverName: 'Muthu',
      workType: 'Harvest',
      variant: '',
      durationSecs: 14400,
      durationFormatted: '4h 00m',
      ratePerHour: 1400,
      totalAmount: 5600,
      status: 'Paid',
      notes: 'Thalavadi paddy harvest run',
      date: '25 Oct',
    },
  ];
  localStorage.setItem('agri_bills', JSON.stringify(defaultBills));
  return defaultBills;
}

function saveLocalBill(b: Omit<Bill, 'billId' | 'date'> & { billId?: string; date?: string }): Bill {
  const current = getLocalBills();
  const billId = (b.billId || `#INV-${Math.floor(10000 + Math.random() * 90000)}`).replace(/[-_]?2026/g, '');
  const rawDate = b.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const date = rawDate.replace(/[\s\-/]?2026/g, '').trim();
  const newBill: Bill = { ...b, _id: `bill_${Date.now()}`, billId, date };
  current.unshift(newBill);
  localStorage.setItem('agri_bills', JSON.stringify(current));
  return newBill;
}

function toggleLocalBill(id: string, newStatus?: 'Paid' | 'Pending'): Bill | null {
  const current = getLocalBills();
  const target = current.find((b) => b._id === id || b.billId === id);
  if (!target) return null;
  target.status = newStatus || (target.status === 'Paid' ? 'Pending' : 'Paid');
  localStorage.setItem('agri_bills', JSON.stringify(current));
  return target;
}

function updateLocalBillNote(id: string, notes: string): Bill | null {
  const current = getLocalBills();
  const target = current.find((b) => b._id === id || b.billId === id || b.id === id);
  if (!target) return null;
  target.notes = notes;
  localStorage.setItem('agri_bills', JSON.stringify(current));
  return target;
}

function deleteLocalBill(id: string): boolean {
  const current = getLocalBills();
  const filtered = current.filter((b) => b._id !== id && b.billId !== id);
  localStorage.setItem('agri_bills', JSON.stringify(filtered));
  return true;
}

function computeLocalStats(): Stats {
  const bills = getLocalBills();
  let totalRevenue = 0;
  let totalSecs = 0;
  let pendingDues = 0;
  let paidCount = 0;
  let pendingCount = 0;
  const workMap: Record<string, { count: number; revenue: number }> = {};

  bills.forEach((b) => {
    totalSecs += b.durationSecs || 0;
    if (b.status === 'Paid') {
      totalRevenue += b.totalAmount || 0;
      paidCount++;
    } else {
      pendingDues += b.totalAmount || 0;
      pendingCount++;
    }
    const wt = b.workType || 'Other';
    if (!workMap[wt]) workMap[wt] = { count: 0, revenue: 0 };
    workMap[wt].count++;
    workMap[wt].revenue += b.totalAmount || 0;
  });

  return {
    totalRevenue,
    totalHours: parseFloat((totalSecs / 3600).toFixed(1)),
    pendingDues,
    completedJobs: bills.length,
    paidCount,
    pendingCount,
    monthlyData: [
      { month: 'Jun', revenue: 14500, hours: 18.5 },
      { month: 'Jul', revenue: 21200, hours: 26.0 },
      { month: 'Aug', revenue: 28900, hours: 34.2 },
      { month: 'Sep', revenue: 32400, hours: 38.0 },
      { month: 'Oct', revenue: totalRevenue > 0 ? totalRevenue : 41200, hours: parseFloat((totalSecs / 3600).toFixed(1)) || 48.5 },
    ],
    workTypeBreakdown: Object.entries(workMap).map(([name, data]) => ({ name, ...data })),
    paymentStatusDistribution: [
      { name: 'Paid', value: totalRevenue, count: paidCount, color: '#10b981' },
      { name: 'Pending', value: pendingDues, count: pendingCount, color: '#f59e0b' },
    ],
  };
}

// ── Fleet Drivers API (Owner Only Management) ──
const DEFAULT_DRIVERS: Driver[] = [
  {
    _id: 'drv_101',
    id: 'drv_101',
    name: 'Muthu Kumar',
    phone: '+91 94433 11223',
    licenseNumber: 'TN-28-2022-0098234',
    assignedTractor: 'Mahindra 575 DI (45 HP)',
    experienceYears: 6,
    hourlyWage: 150,
    dailyWage: 1100,
    status: 'On Duty',
    address: 'Kangeyam, Tirupur Dist',
    specialty: ['Rotavator', '9-Tine Cultivator', 'Disc Plough'],
    totalTrips: 42,
    totalHours: 184,
    joinedDate: '2025-04-12',
  },
  {
    _id: 'drv_102',
    id: 'drv_102',
    name: 'Suresh Selvan',
    phone: '+91 98421 77332',
    licenseNumber: 'TN-33-2021-0044129',
    assignedTractor: 'John Deere 5050 D (50 HP)',
    experienceYears: 4,
    hourlyWage: 160,
    dailyWage: 1200,
    status: 'Available',
    address: 'Dharapuram, Tirupur Dist',
    specialty: ['Laser Leveler', 'Reversible Plough', 'Trailer'],
    totalTrips: 28,
    totalHours: 112,
    joinedDate: '2025-07-20',
  },
  {
    _id: 'drv_103',
    id: 'drv_103',
    name: 'Murugan P',
    phone: '+91 97880 55661',
    licenseNumber: 'TN-28-2019-0012876',
    assignedTractor: 'Massey Ferguson 241 DI',
    experienceYears: 8,
    hourlyWage: 150,
    dailyWage: 1050,
    status: 'Available',
    address: 'Uthukuli, Tirupur Dist',
    specialty: ['Rotavator', 'Puddler Wet Field', 'Cultivator'],
    totalTrips: 65,
    totalHours: 290,
    joinedDate: '2024-11-15',
  },
  {
    _id: 'drv_104',
    id: 'drv_104',
    name: 'Rajendran K',
    phone: '+91 94862 33445',
    licenseNumber: 'TN-38-2020-0087654',
    assignedTractor: 'Swaraj 744 FE (48 HP)',
    experienceYears: 5,
    hourlyWage: 140,
    dailyWage: 1000,
    status: 'Inactive',
    address: 'Palladam, Tirupur Dist',
    specialty: ['Cultivator', 'Trailer Transport'],
    totalTrips: 19,
    totalHours: 76,
    joinedDate: '2025-01-10',
  }
];

export const getLocalDrivers = (): Driver[] => {
  if (typeof window === 'undefined') return DEFAULT_DRIVERS;
  try {
    const raw = localStorage.getItem('agri_fleet_drivers');
    if (!raw) {
      localStorage.setItem('agri_fleet_drivers', JSON.stringify(DEFAULT_DRIVERS));
      return DEFAULT_DRIVERS;
    }
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let changed = false;
      parsed = parsed.map((d: Driver) => {
        const updated = { ...d };
        if (typeof updated.joinedDate === 'string' && updated.joinedDate.includes('2026')) {
          updated.joinedDate = updated.joinedDate.replace(/2026/g, '2025');
          changed = true;
        }
        if (typeof updated.licenseNumber === 'string' && updated.licenseNumber.includes('2026')) {
          updated.licenseNumber = updated.licenseNumber.replace(/2026/g, '2025');
          changed = true;
        }
        return updated;
      });
      if (changed) {
        localStorage.setItem('agri_fleet_drivers', JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_DRIVERS;
  } catch {
    return DEFAULT_DRIVERS;
  }
};

export const setLocalDrivers = (drivers: Driver[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('agri_fleet_drivers', JSON.stringify(drivers));
  } catch {
    // Storage quota
  }
};

export const driversAPI = {
  async getAll(): Promise<Driver[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.drivers && Array.isArray(data.drivers)) {
        setLocalDrivers(data.drivers);
        return data.drivers;
      }
      return getLocalDrivers();
    } catch {
      return getLocalDrivers();
    }
  },

  async create(payload: Partial<Driver> & { createLoginAccount?: boolean; driverEmail?: string; driverPassword?: string }): Promise<Driver> {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.driver) {
        const current = getLocalDrivers();
        setLocalDrivers([data.driver, ...current]);
        return data.driver;
      }
      throw new Error(data.message || 'Failed to add driver');
    } catch {
      const newDriver: Driver = {
        _id: `drv_${Date.now()}`,
        id: `drv_${Date.now()}`,
        name: payload.name || 'New Driver',
        phone: payload.phone || '+91 90000 00000',
        licenseNumber: payload.licenseNumber || 'TN-00-2025-0000000',
        assignedTractor: payload.assignedTractor || 'Mahindra 575 DI (45 HP)',
        experienceYears: payload.experienceYears || 3,
        hourlyWage: payload.hourlyWage || 150,
        dailyWage: payload.dailyWage || 1000,
        status: payload.status || 'Available',
        address: payload.address || '',
        specialty: payload.specialty || ['Rotavator', 'Cultivator'],
        totalTrips: 0,
        totalHours: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      };
      const current = getLocalDrivers();
      setLocalDrivers([newDriver, ...current]);
      return newDriver;
    }
  },

  async update(id: string, payload: Partial<Driver>): Promise<Driver | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.driver) {
        const current = getLocalDrivers();
        setLocalDrivers(current.map((d) => (d._id === id || d.id === id ? data.driver : d)));
        return data.driver;
      }
    } catch {
      // Local fallback
    }
    const current = getLocalDrivers();
    const updated = current.map((d) => (d._id === id || d.id === id ? { ...d, ...payload } : d));
    setLocalDrivers(updated);
    return updated.find((d) => d._id === id || d.id === id) || null;
  },

  async delete(id: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE_URL}/drivers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch {
      // Local fallback
    }
    const current = getLocalDrivers();
    setLocalDrivers(current.filter((d) => d._id !== id && d.id !== id));
    return true;
  },

  async toggleStatus(id: string, nextStatus: Driver['status']): Promise<Driver | null> {
    return this.update(id, { status: nextStatus });
  },
};

// ── Active Tractor Fleet Settings ──
export const DEFAULT_TRACTOR_CONFIG: ActiveTractorConfig = {
  registrationNumber: 'TN-28-AT-5590',
  model: 'Mahindra 575 DI (45 HP)',
  driverName: 'Logesh M',
  status: 'Active',
  currentHours: 384,
  nextServiceHours: 500,
  dieselLevelPercent: 78,
};

export const getLocalTractorConfig = (): ActiveTractorConfig => {
  if (typeof window === 'undefined') return DEFAULT_TRACTOR_CONFIG;
  try {
    const raw = localStorage.getItem('agri_active_tractor');
    if (!raw) {
      localStorage.setItem('agri_active_tractor', JSON.stringify(DEFAULT_TRACTOR_CONFIG));
      return DEFAULT_TRACTOR_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TRACTOR_CONFIG;
  }
};

export const setLocalTractorConfig = (config: ActiveTractorConfig) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('agri_active_tractor', JSON.stringify(config));
  } catch {
    // Storage quota
  }
};

// ── Tractor Service & Customer Description Branding (Owner Configured) ──
export const DEFAULT_TRACTOR_SERVICE_CONFIG: TractorServiceConfig = {
  serviceName: 'Muthu Tractor Fleet',
  tagline: 'Agricultural Machinery, Cultivation & Harvest Operations',
  phone: '+91 94433 88123',
  location: 'Tamil Nadu, India',
  customerDescription: 'Thank you for partnering with our Tractor Fleet! Official digital tax invoice and field service record.',
  gstin: '33AAAAA0000A1Z5',
};

export const getLocalTractorServiceConfig = (): TractorServiceConfig => {
  if (typeof window === 'undefined') return DEFAULT_TRACTOR_SERVICE_CONFIG;
  try {
    const raw = localStorage.getItem('agri_service_config');
    if (!raw) {
      localStorage.setItem('agri_service_config', JSON.stringify(DEFAULT_TRACTOR_SERVICE_CONFIG));
      return DEFAULT_TRACTOR_SERVICE_CONFIG;
    }
    return { ...DEFAULT_TRACTOR_SERVICE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TRACTOR_SERVICE_CONFIG;
  }
};

export const setLocalTractorServiceConfig = (config: TractorServiceConfig) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('agri_service_config', JSON.stringify(config));
  } catch {
    // Storage quota
  }
};

