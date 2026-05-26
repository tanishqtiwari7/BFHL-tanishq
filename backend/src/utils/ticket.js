const priorityTargets = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320,
};

const statusOrder = ["open", "in_progress", "resolved", "closed"];

export const getPriorityTargetMinutes = (priority) => {
  return priorityTargets[priority] ?? null;
};

export const getDerivedFields = (ticket) => {
  const createdAt = new Date(ticket.createdAt);
  const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt) : null;
  const endTime = resolvedAt ?? new Date();
  const ageMinutes = Math.max(0, Math.round((endTime - createdAt) / 60000));
  const target = getPriorityTargetMinutes(ticket.priority);
  const slaBreached = target ? ageMinutes > target : false;

  return { ageMinutes, slaBreached };
};

export const canTransition = (fromStatus, toStatus) => {
  const fromIndex = statusOrder.indexOf(fromStatus);
  const toIndex = statusOrder.indexOf(toStatus);

  if (fromIndex === -1 || toIndex === -1) {
    return false;
  }

  if (toIndex === fromIndex) {
    return true;
  }

  if (toIndex === fromIndex + 1) {
    return true;
  }

  if (toIndex === fromIndex - 1) {
    return true;
  }

  return false;
};

export const getNextStatus = (status) => {
  const index = statusOrder.indexOf(status);
  return index >= 0 && index < statusOrder.length - 1
    ? statusOrder[index + 1]
    : null;
};

export const getPrevStatus = (status) => {
  const index = statusOrder.indexOf(status);
  return index > 0 ? statusOrder[index - 1] : null;
};

export const statusFlow = statusOrder;
