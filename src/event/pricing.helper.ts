import { Decimal } from '@prisma/client/runtime/library';
import { RentalType } from '@prisma/client';

export class PricingHelper {
  // Calculate rental duration in hours
  static calculateDuration(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.ceil(hours);
  }

  // Calculate base price based on rental type

  static calculateBasePrice(
    rentalType: RentalType,
    pricePerHour: Decimal | null,
    pricePerDay: Decimal | null,
    durationHours: number,
  ): number {
    if (rentalType === RentalType.DAILY) {
      if (!pricePerDay) {
        throw new Error('Daily price not set for this venue');
      }
      const days = Math.ceil(durationHours / 24);
      return Number(pricePerDay) * days;
    } else {
      if (!pricePerHour) {
        throw new Error('Hourly price not set for this venue');
      }
      return Number(pricePerHour) * durationHours;
    }
  }

  // Calculate final price with discount and fees

  static calculateFinalPrice(
    basePrice: number,
    discountPercent: number = 0,
    additionalFees: number = 0,
  ): number {
    const discountAmount = (basePrice * discountPercent) / 100;
    const priceAfterDiscount = basePrice - discountAmount;
    const finalPrice = priceAfterDiscount + additionalFees;
    return Math.round(finalPrice);
  }

  // Get optimal rental type

  static getOptimalRentalType(
    pricePerHour: Decimal | null,
    pricePerDay: Decimal | null,
    durationHours: number,
  ): RentalType {
    if (!pricePerHour || !pricePerDay) {
      return pricePerHour ? RentalType.HOURLY : RentalType.DAILY;
    }

    const hourlyPrice = Number(pricePerHour) * durationHours;
    const days = Math.ceil(durationHours / 24);
    const dailyPrice = Number(pricePerDay) * days;

    return hourlyPrice <= dailyPrice ? RentalType.HOURLY : RentalType.DAILY;
  }

  // Format currency to IDR
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
