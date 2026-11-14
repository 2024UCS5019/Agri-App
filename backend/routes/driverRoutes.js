const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const User = require('../models/User');
const { getConnectionStatus } = require('../config/db');

// In-memory fallback seeded with realistic drivers
let inMemoryDrivers = [
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

// GET /api/drivers - Get all fleet drivers
router.get('/', async (req, res) => {
  try {
    const dbStatus = getConnectionStatus();
    if (dbStatus.connected) {
      const drivers = await Driver.find().sort({ createdAt: -1 });
      if (drivers && drivers.length > 0) {
        return res.json({ success: true, count: drivers.length, drivers });
      }
      // If DB is empty, seed initial drivers
      await Driver.insertMany(inMemoryDrivers);
      const seeded = await Driver.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: seeded.length, drivers: seeded });
    }
    return res.json({ success: true, count: inMemoryDrivers.length, drivers: inMemoryDrivers });
  } catch (err) {
    return res.json({ success: true, count: inMemoryDrivers.length, drivers: inMemoryDrivers });
  }
});

// POST /api/drivers - Owner adds a new driver
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      licenseNumber,
      assignedTractor,
      experienceYears,
      hourlyWage,
      dailyWage,
      status,
      address,
      specialty,
      ownerEmail,
      createLoginAccount,
      driverEmail,
      driverPassword,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Driver name is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Driver contact phone is required.' });
    }
    if (!licenseNumber || !licenseNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Driving license number is required.' });
    }

    const newDriverData = {
      name: name.trim(),
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      assignedTractor: assignedTractor || 'Mahindra 575 DI (45 HP)',
      experienceYears: Number(experienceYears) || 3,
      hourlyWage: Number(hourlyWage) || 150,
      dailyWage: Number(dailyWage) || 1000,
      status: status || 'Available',
      address: address ? address.trim() : '',
      specialty: Array.isArray(specialty) && specialty.length > 0 ? specialty : ['Rotavator', 'Cultivator'],
      totalTrips: 0,
      totalHours: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      ownerEmail: ownerEmail || 'owner@agri.in',
    };

    // If owner opted to create login account for the driver
    if (createLoginAccount && driverEmail && driverPassword) {
      try {
        const dbStatus = getConnectionStatus();
        if (dbStatus.connected) {
          const existingUser = await User.findOne({ email: driverEmail.trim().toLowerCase() });
          if (!existingUser) {
            const driverUser = new User({
              name: name.trim(),
              email: driverEmail.trim().toLowerCase(),
              password: driverPassword,
              role: 'Driver',
              phone: phone.trim(),
              tractorModel: assignedTractor || 'Mahindra 575 DI Sarpanch',
              licenseNumber: licenseNumber.trim().toUpperCase(),
            });
            await driverUser.save();
          }
        }
      } catch (authErr) {
        console.warn('Driver user account creation skipped/failed:', authErr.message);
      }
    }

    const dbStatus = getConnectionStatus();
    if (dbStatus.connected) {
      const driver = new Driver(newDriverData);
      await driver.save();
      return res.status(201).json({
        success: true,
        message: `Driver ${driver.name} successfully registered to fleet!`,
        driver,
      });
    }

    // In-memory fallback
    const fallbackId = `drv_${Date.now()}`;
    const fallbackDriver = {
      ...newDriverData,
      _id: fallbackId,
      id: fallbackId,
      createdAt: new Date().toISOString(),
    };
    inMemoryDrivers.unshift(fallbackDriver);

    return res.status(201).json({
      success: true,
      message: `Driver ${fallbackDriver.name} successfully registered to fleet (Local)!`,
      driver: fallbackDriver,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to add driver' });
  }
});

// PUT /api/drivers/:id - Update driver details or status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getConnectionStatus();

    if (dbStatus.connected) {
      const updated = await Driver.findByIdAndUpdate(id, req.body, { new: true });
      if (updated) {
        return res.json({ success: true, message: 'Driver details updated', driver: updated });
      }
    }

    // In-memory update
    const idx = inMemoryDrivers.findIndex((d) => d._id === id || d.id === id);
    if (idx !== -1) {
      inMemoryDrivers[idx] = { ...inMemoryDrivers[idx], ...req.body };
      return res.json({ success: true, message: 'Driver details updated', driver: inMemoryDrivers[idx] });
    }

    return res.status(404).json({ success: false, message: 'Driver not found' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update driver' });
  }
});

// DELETE /api/drivers/:id - Remove driver from fleet
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getConnectionStatus();

    if (dbStatus.connected) {
      await Driver.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Driver removed from fleet' });
    }

    inMemoryDrivers = inMemoryDrivers.filter((d) => d._id !== id && d.id !== id);
    return res.json({ success: true, message: 'Driver removed from fleet' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete driver' });
  }
});

module.exports = router;
