const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all tickets
// @route   GET /api/v1/tickets
// @access  Private
exports.getTickets = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === 'admin') {
    query = Ticket.find().populate('createdBy assignedTo', 'name email role');
  } else if (req.user.role === 'support') {
    query = Ticket.find({
      $or: [
        { assignedTo: req.user.id },
        { status: 'open' }
      ]
    }).populate('createdBy assignedTo', 'name email role');
  } else {
    query = Ticket.find({ createdBy: req.user.id }).populate('assignedTo', 'name email role');
  }

  const tickets = await query.sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get single ticket
// @route   GET /api/v1/tickets/:id
// @access  Private
exports.getTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy assignedTo', 'name email role')
    .populate('comments.user', 'name email role');

  if (!ticket) {
    return next(
      new ErrorResponse(`No ticket found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is ticket owner, admin or assigned support
  if (
    ticket.createdBy._id.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    (req.user.role !== 'support' || ticket.assignedTo?._id.toString() !== req.user.id)
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this ticket`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Create new ticket
// @route   POST /api/v1/tickets
// @access  Private
exports.createTicket = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const ticket = await Ticket.create(req.body);

  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Update ticket
// @route   PUT /api/v1/tickets/:id
// @access  Private
exports.updateTicket = asyncHandler(async (req, res, next) => {
  let ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return next(
      new ErrorResponse(`No ticket found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is ticket owner, admin or assigned support
  if (
    ticket.createdBy._id.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    (req.user.role !== 'support' || ticket.assignedTo?._id.toString() !== req.user.id)
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this ticket`,
        401
      )
    );
  }

  // Only admin or assigned support can change status or assignee
  if (req.body.status || req.body.assignedTo) {
    if (req.user.role !== 'admin' && 
        (req.user.role !== 'support' || ticket.assignedTo?._id.toString() !== req.user.id)) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update ticket status or assignee`,
          401
        )
      );
    }
  }

  ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Add comment to ticket
// @route   POST /api/v1/tickets/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return next(
      new ErrorResponse(`No ticket found with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is ticket owner, admin or assigned support
  if (
    ticket.createdBy._id.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    (req.user.role !== 'support' || ticket.assignedTo?._id.toString() !== req.user.id)
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to comment on this ticket`,
        401
      )
    );
  }

  const newComment = {
    user: req.user.id,
    text: req.body.text
  };

  ticket.comments.unshift(newComment);
  await ticket.save();

  res.status(200).json({
    success: true,
    data: ticket.comments
  });
});
