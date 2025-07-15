const express = require('express');
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  addComment
} = require('../controllers/ticketController');

const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:id')
  .get(getTicket)
  .put(updateTicket);

router.route('/:id/comments')
  .post(addComment);

module.exports = router;
