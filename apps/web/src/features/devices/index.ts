/**
 * `devices` feature — public API (F3.8). Read-only fleet view consumed by
 * Manager and HQ pages.
 */
export { DevicesScreen, type DevicesScreenProps } from "./components/devices-screen";
export { listDevices, type ListDevicesArgs } from "./server/list-devices";
export { aggregateDeviceStats, type DeviceStats } from "./services/aggregate-device-stats";
