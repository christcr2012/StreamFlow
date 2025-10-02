import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  unit_price: z.number().positive(),
  quantity: z.number().int().min(0).default(0),
  reorder_point: z.number().int().min(0).default(10),
  bu_id: z.string().optional(),
});

const AdjustStockSchema = z.object({
  item_id: z.string().min(1),
  quantity_change: z.number().int(),
  reason: z.string().min(1),
  reference: z.string().optional(),
});

const CreatePurchaseOrderSchema = z.object({
  vendor_name: z.string().min(1),
  items: z.array(z.object({
    item_id: z.string().min(1),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive(),
  })),
  expected_delivery: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export class InventoryService {
  /**
   * Create inventory item
   */
  async createItem(
    orgId: string,
    userId: string,
    data: z.infer<typeof CreateInventoryItemSchema>
  ) {
    const validated = CreateInventoryItemSchema.parse(data);

    // Generate asset number
    const assetCount = await prisma.asset.count({ where: { orgId } });
    const assetNumber = `INV-${String(assetCount + 1).padStart(6, '0')}`;

    // Store as Asset with category='inventory'
    const item = await prisma.asset.create({
      data: {
        orgId,
        buId: validated.bu_id,
        assetNumber,
        qrCode: `INV-${validated.sku}`,
        name: validated.name,
        description: validated.description,
        category: 'inventory',
        status: 'active',
        customFields: {
          sku: validated.sku,
          inventory_category: validated.category,
          unit_price: validated.unit_price,
          quantity: validated.quantity,
          reorder_point: validated.reorder_point,
        } as any,
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'create',
        resource: `inventory:${item.id}`,
        meta: {
          name: validated.name,
          sku: validated.sku,
          quantity: validated.quantity,
        },
      },
    });

    return item;
  }

  /**
   * Adjust stock quantity
   */
  async adjustStock(
    orgId: string,
    userId: string,
    data: z.infer<typeof AdjustStockSchema>
  ) {
    const validated = AdjustStockSchema.parse(data);

    const item = await prisma.asset.findFirst({
      where: {
        id: validated.item_id,
        orgId,
        category: 'inventory',
      },
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    const currentFields = (item.customFields as any) || {};
    const currentQty = currentFields.quantity || 0;
    const newQty = currentQty + validated.quantity_change;

    if (newQty < 0) {
      throw new Error('Insufficient stock');
    }

    const updated = await prisma.asset.update({
      where: { id: validated.item_id },
      data: {
        customFields: {
          ...currentFields,
          quantity: newQty,
        } as any,
      },
    });

    // Record history
    await prisma.assetHistory.create({
      data: {
        orgId,
        assetId: validated.item_id,
        userId,
        action: validated.quantity_change > 0 ? 'stock_in' : 'stock_out',
        fromValue: String(currentQty),
        toValue: String(newQty),
        notes: `${validated.reason}. Change: ${validated.quantity_change}. New quantity: ${newQty}`,
      },
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'adjust_stock',
        resource: `inventory:${validated.item_id}`,
        meta: {
          quantity_change: validated.quantity_change,
          new_quantity: newQty,
          reason: validated.reason,
        },
      },
    });

    return updated;
  }

  /**
   * Get inventory item
   */
  async getItem(orgId: string, itemId: string) {
    const item = await prisma.asset.findFirst({
      where: {
        id: itemId,
        orgId,
        category: 'inventory',
      },
    });

    if (!item) {
      throw new Error('Inventory item not found');
    }

    const fields = (item.customFields as any) || {};

    return {
      id: item.id,
      name: item.name,
      sku: fields.sku,
      category: fields.inventory_category,
      description: item.description,
      unit_price: fields.unit_price,
      quantity: fields.quantity || 0,
      reorder_point: fields.reorder_point || 10,
      status: item.status,
      bu_id: item.buId,
    };
  }

  /**
   * List inventory items
   */
  async listItems(
    orgId: string,
    filters?: {
      category?: string;
      bu_id?: string;
      low_stock?: boolean;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = {
      orgId,
      category: 'inventory',
    };

    if (filters?.bu_id) {
      where.buId = filters.bu_id;
    }

    const items = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    let filteredItems = items.map((item) => {
      const fields = (item.customFields as any) || {};
      return {
        id: item.id,
        name: item.name,
        sku: fields.sku,
        category: fields.inventory_category,
        unit_price: fields.unit_price,
        quantity: fields.quantity || 0,
        reorder_point: fields.reorder_point || 10,
        status: item.status,
        bu_id: item.buId,
      };
    });

    if (filters?.category) {
      filteredItems = filteredItems.filter((i) => i.category === filters.category);
    }

    if (filters?.low_stock) {
      filteredItems = filteredItems.filter((i) => i.quantity <= i.reorder_point);
    }

    return {
      items: filteredItems,
      total: filteredItems.length,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Get stock history
   */
  async getStockHistory(
    orgId: string,
    itemId: string,
    limit: number = 50
  ) {
    const history = await prisma.assetHistory.findMany({
      where: {
        orgId,
        assetId: itemId,
        action: { in: ['stock_in', 'stock_out'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history.map((h) => ({
      id: h.id,
      action: h.action,
      performed_by: h.userId,
      performed_at: h.createdAt,
      notes: h.notes,
      from_value: h.fromValue,
      to_value: h.toValue,
    }));
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(orgId: string, buId?: string) {
    const where: any = {
      orgId,
      category: 'inventory',
      status: 'active',
    };

    if (buId) {
      where.buId = buId;
    }

    const items = await prisma.asset.findMany({ where });

    const lowStockItems = items.filter((item) => {
      const fields = (item.customFields as any) || {};
      const quantity = fields.quantity || 0;
      const reorderPoint = fields.reorder_point || 10;
      return quantity <= reorderPoint;
    });

    return lowStockItems.map((item) => {
      const fields = (item.customFields as any) || {};
      return {
        id: item.id,
        name: item.name,
        sku: fields.sku,
        quantity: fields.quantity || 0,
        reorder_point: fields.reorder_point || 10,
        bu_id: item.buId,
      };
    });
  }
}

export const inventoryService = new InventoryService();

