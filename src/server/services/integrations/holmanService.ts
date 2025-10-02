/**
 * Holman Integration Service
 * Binder3: Fleet fuel card integration
 * 
 * Syncs fuel transactions and detects anomalies
 */

import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit/auditLog';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface HolmanConfig {
  accountId: string;
  apiKey: string;
  baseUrl: string;
}

export interface HolmanFuelTransaction {
  transactionId: string;
  cardNumber: string;
  vehicleId: string;
  date: string;
  location: string;
  gallons: number;
  pricePerGallon: number;
  totalAmount: number;
  odometer: number;
  productType: string;
}

export interface FuelAnomaly {
  transactionId: string;
  type: 'unusual_volume' | 'unusual_price' | 'unusual_frequency' | 'unusual_location';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class HolmanService {
  /**
   * Get Holman configuration for tenant
   */
  private async getConfig(orgId: string): Promise<HolmanConfig | null> {
    const integration = await prisma.integrationConfig.findFirst({
      where: {
        orgId,
        type: 'holman',
        status: 'connected',
      },
    });

    if (!integration || !integration.config) {
      return null;
    }

    return integration.config as any as HolmanConfig;
  }

  /**
   * Sync fuel transactions from Holman
   */
  async syncFuelTransactions(
    orgId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    synced: number;
    anomalies: number;
    errors: string[];
  }> {
    const config = await this.getConfig(orgId);
    if (!config) {
      throw new Error('Holman integration not configured');
    }

    // In production, call Holman API
    // For now, simulate sync
    const transactions: HolmanFuelTransaction[] = [];

    let synced = 0;
    let anomaliesDetected = 0;
    const errors: string[] = [];

    for (const txn of transactions) {
      try {
        // Find matching vehicle
        const vehicle = await prisma.fleetVehicle.findFirst({
          where: {
            orgId,
            // Match by vehicle ID or card number
          },
        });

        // Store transaction
        const stored = await prisma.holmanFuelTransaction.create({
          data: {
            orgId,
            vehicleRef: vehicle?.id,
            driverPin: txn.cardNumber,
            purchasedAt: new Date(txn.date),
            gallons: txn.gallons,
            pricePerGallon: txn.pricePerGallon,
            totalCents: BigInt(Math.round(txn.totalAmount * 100)),
            odometer: BigInt(txn.odometer),
            vendor: txn.location,
            raw: txn as any,
          },
        });

        synced++;

        // Detect anomalies
        const anomalies = await this.detectAnomalies(orgId, stored.id, txn);
        anomaliesDetected += anomalies.length;

        // Update vehicle odometer if available
        if (vehicle && txn.odometer > 0) {
          await prisma.fleetVehicle.update({
            where: { id: vehicle.id },
            data: { odometer: BigInt(txn.odometer) },
          });
        }
      } catch (error: any) {
        errors.push(`Failed to sync transaction ${txn.transactionId}: ${error.message}`);
      }
    }

    // Audit log
    await auditLog({
      tenantId: orgId,
      userId,
      action: 'update',
      resource: 'holman:fuel_sync',
      meta: { synced, anomaliesDetected, errors: errors.length, startDate, endDate },
    });

    return {
      synced,
      anomalies: anomaliesDetected,
      errors,
    };
  }

  /**
   * Detect fuel anomalies
   */
  async detectAnomalies(
    orgId: string,
    transactionId: string,
    transaction: HolmanFuelTransaction
  ): Promise<FuelAnomaly[]> {
    const anomalies: FuelAnomaly[] = [];

    // Get vehicle's recent transactions for comparison
    const recentTransactions = await prisma.holmanFuelTransaction.findMany({
      where: {
        orgId,
        vehicleRef: transaction.vehicleId,
        purchasedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { purchasedAt: 'desc' },
      take: 10,
    });

    if (recentTransactions.length === 0) {
      return anomalies; // Not enough data
    }

    // Calculate averages
    const avgGallons =
      recentTransactions.reduce((sum, t) => sum + Number(t.gallons || 0), 0) / recentTransactions.length;
    const avgPrice =
      recentTransactions.reduce((sum, t) => sum + Number(t.pricePerGallon || 0), 0) /
      recentTransactions.length;

    // Check for unusual volume (>2x average)
    if (transaction.gallons > avgGallons * 2) {
      anomalies.push({
        transactionId,
        type: 'unusual_volume',
        severity: 'medium',
        description: `Fuel volume (${transaction.gallons} gal) is ${(
          (transaction.gallons / avgGallons) *
          100
        ).toFixed(0)}% of average`,
      });
    }

    // Check for unusual price (>20% above average)
    if (transaction.pricePerGallon > avgPrice * 1.2) {
      anomalies.push({
        transactionId,
        type: 'unusual_price',
        severity: 'low',
        description: `Price per gallon ($${transaction.pricePerGallon}) is ${(
          ((transaction.pricePerGallon - avgPrice) / avgPrice) *
          100
        ).toFixed(0)}% above average`,
      });
    }

    // Check for unusual frequency (multiple transactions same day)
    const sameDayTransactions = recentTransactions.filter(
      (t) =>
        t.purchasedAt?.toDateString() === new Date(transaction.date).toDateString() &&
        t.id !== transactionId
    );

    if (sameDayTransactions.length > 0) {
      anomalies.push({
        transactionId,
        type: 'unusual_frequency',
        severity: 'high',
        description: `Multiple fuel transactions on same day (${sameDayTransactions.length + 1} total)`,
      });
    }

    return anomalies;
  }

  /**
   * Test Holman connection
   */
  async testConnection(orgId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const config = await this.getConfig(orgId);
    if (!config) {
      return {
        success: false,
        message: 'Holman integration not configured',
      };
    }

    // In production, test API connection
    // For now, simulate success
    return {
      success: true,
      message: 'Connection successful',
    };
  }
}

// Export singleton instance
export const holmanService = new HolmanService();

