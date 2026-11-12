import express from 'express';
import Equipment from '../models/Equipment.js';
import { isAuthenticated, requireAdmin, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all equipment
router.get('/', async (req, res) => {
  try {
    const items = await Equipment.find().sort({ createdAt: -1 });
    res.json({ success: true, count: items.length, equipment: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add equipment (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, brand, quantity, location, status } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Equipment name is required' });
    }

    const qty = Number(quantity) || 1;
    const item = await Equipment.create({
      name,
      brand: brand || 'Life Fitness',
      quantity: qty,
      working: qty,
      maintenance: 0,
      location: location || 'Main Floor',
      status: status || 'good',
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    res.status(201).json({ success: true, message: 'Equipment registered', equipment: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update status / report maintenance (Staff only: Admin, Trainer, Receptionist)
router.put('/:id', requireRole('admin', 'trainer', 'receptionist'), async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, equipment: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE equipment
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Equipment removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
