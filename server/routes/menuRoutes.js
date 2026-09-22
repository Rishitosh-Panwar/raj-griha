const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const uploadMenu = require('../middleware/uploadMenu');

router.get('/', getMenuItems);
router.post('/', protect, authorize('admin'), uploadMenu.single('image'), createMenuItem);
router.put('/:id', protect, authorize('admin'), uploadMenu.single('image'), updateMenuItem);
router.delete('/:id', protect, authorize('admin'), deleteMenuItem);

module.exports = router;