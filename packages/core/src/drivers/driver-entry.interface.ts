import { NotificationDriver } from '../interfaces/driver.interface';

export interface DriverEntry {
  driver: NotificationDriver;
  priority?: number;
  weight?: number;
}
