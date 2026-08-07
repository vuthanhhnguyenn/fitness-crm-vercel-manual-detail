const TIME_SLOT_PATTERN = /^\d{1,2}:\d{2}(:\d{2})?$/;

function getTimezoneSuffix(iso: string): string {
  const match = iso.match(/(Z|[+-]\d{2}:\d{2})$/);
  return match?.[1] ?? '+09:00';
}

/** Apply HH:mm time slot onto the schedule's existing date (for mock persistence). */
export function applyTimeSlotToSchedule(scheduleStartTime: string, timeSlot: string): string {
  if (!TIME_SLOT_PATTERN.test(timeSlot)) {
    return timeSlot;
  }

  const dateStr = scheduleStartTime.slice(0, 10);
  const [hour, minute = '00'] = timeSlot.split(':');
  const tz = getTimezoneSuffix(scheduleStartTime);
  return `${dateStr}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00${tz}`;
}
