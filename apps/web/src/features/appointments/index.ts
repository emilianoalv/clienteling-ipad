/**
 * `appointments` feature — public API.
 * Spec: docs/05-feature-modules.md § "features/appointments/".
 */
export { AppointmentCalendar } from "./components/appointment-calendar";
export { AppointmentDetailModal } from "./components/appointment-detail-modal";
export { AgendaRow } from "./components/agenda-row";
export { AvailabilityGrid } from "./components/availability-grid";
export { NewAppointmentForm } from "./components/new-appointment-form";
export { ManagementPanel } from "./components/management-panel";
export { aggregateAppointmentStats } from "./services/appointment-stats";

export { listAppointments } from "./server/list-appointments";
export { fetchAppointment, fetchAppointmentWithClient } from "./server/fetch-appointment";

export { createAppointment } from "./actions/create-appointment";
export { rescheduleAppointment } from "./actions/reschedule-appointment";
export { cancelAppointment } from "./actions/cancel-appointment";
export { transitionAppointment } from "./actions/update-appointment-status";

export { hasConflict } from "./services/has-conflict";
export { buildDaySlots } from "./services/build-day-slots";
