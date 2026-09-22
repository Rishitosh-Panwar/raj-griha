const Settings = require('../models/Settings');

// @route GET /api/settings
// public — the frontend needs this to display advance amounts
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route PUT /api/settings
// admin only
const updateSettings = async (req, res) => {
  try {
    const { advancePercentage } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    if (advancePercentage !== undefined) {
      const pct = Number(advancePercentage);
      if (pct < 1 || pct > 100) return res.status(400).json({ message: 'Percentage must be between 1 and 100' });
      settings.advancePercentage = pct;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getSettings, updateSettings };