const express = require('express');
const router = express.Router();
const { sendRoomInquiry, sendGeneralInquiry } = require('../controllers/inquiryController');

router.post('/room', sendRoomInquiry);
router.post('/general', sendGeneralInquiry);

module.exports = router;