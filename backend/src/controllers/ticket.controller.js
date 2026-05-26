import Ticket from "../models/Ticket.js";
import {
  canTransition,
  getDerivedFields,
  getPriorityTargetMinutes,
} from "../utils/ticket.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const attachDerivedFields = (ticket) => {
  const derived = getDerivedFields(ticket);
  return { ...ticket, ...derived };
};

const validatePriority = (value) =>
  ["low", "medium", "high", "urgent"].includes(value);
const validateStatus = (value) =>
  ["open", "in_progress", "resolved", "closed"].includes(value);

export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, customerEmail, priority } = req.body || {};

    if (!subject || !description || !customerEmail || !priority) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ error: "Invalid customer email." });
    }

    if (!validatePriority(priority)) {
      return res.status(400).json({ error: "Invalid priority value." });
    }

    const ticket = await Ticket.create({
      subject,
      description,
      customerEmail,
      priority,
    });

    const plain = ticket.toObject();
    return res.status(201).json(attachDerivedFields(plain));
  } catch (error) {
    return next(error);
  }
};

export const listTickets = async (req, res, next) => {
  try {
    const { status, priority, breached } = req.query;

    const query = {};
    if (status) {
      if (!validateStatus(status)) {
        return res.status(400).json({ error: "Invalid status filter." });
      }
      query.status = status;
    }
    if (priority) {
      if (!validatePriority(priority)) {
        return res.status(400).json({ error: "Invalid priority filter." });
      }
      query.priority = priority;
    }

    const tickets = await Ticket.find(query).sort({ createdAt: -1 }).lean();
    let enriched = tickets.map((ticket) => attachDerivedFields(ticket));

    if (breached === "true") {
      enriched = enriched.filter((ticket) => ticket.slaBreached);
    }

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status || !validateStatus(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    if (!canTransition(ticket.status, status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${ticket.status} to ${status}.`,
      });
    }

    if (status === "resolved" && ticket.status !== "resolved") {
      ticket.resolvedAt = new Date();
    }

    if (ticket.status === "resolved" && status !== "resolved") {
      ticket.resolvedAt = null;
    }

    ticket.status = status;

    await ticket.save();

    res.json(attachDerivedFields(ticket.toObject()));
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id).lean();

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({}).lean();

    const statusCounts = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };
    const priorityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    let breachedOpen = 0;

    tickets.forEach((ticket) => {
      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status] += 1;
      }
      if (priorityCounts[ticket.priority] !== undefined) {
        priorityCounts[ticket.priority] += 1;
      }

      const derived = getDerivedFields(ticket);
      const target = getPriorityTargetMinutes(ticket.priority);
      const isUnresolved =
        ticket.status !== "resolved" && ticket.status !== "closed";

      if (target && derived.slaBreached && isUnresolved) {
        breachedOpen += 1;
      }
    });

    res.json({
      statusCounts,
      priorityCounts,
      breachedOpen,
      totalTickets: tickets.length,
    });
  } catch (error) {
    next(error);
  }
};
