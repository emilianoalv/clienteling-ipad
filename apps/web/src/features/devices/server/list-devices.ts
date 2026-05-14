import "server-only";
import type { Device } from "@/types/device";
import type { StoreId } from "@/types/store";
import { deviceRepository } from "@/server/repositories/device.repository";

export interface ListDevicesArgs {
  storeIds?: readonly StoreId[];
}

export async function listDevices(args: ListDevicesArgs = {}): Promise<Device[]> {
  return deviceRepository.list(args);
}
