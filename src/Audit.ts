import { config } from "dotenv";
import { Logger } from "./Logger";
import { ShipBobAPI } from "./ShipBobApi";
import { AuditConfig } from "./types";

config();



export class Audit {
    private api: ShipBobAPI;
    private logger: Logger;
    private config: AuditConfig;

    constructor(config: AuditConfig) {
        this.config = config;
    }
    public static async create(config: AuditConfig): Promise<Audit> {
        const logger = new Logger(config);
        const api = await ShipBobAPI.create(process.env.SHIPBOB_API_TOKEN, logger);
        const audit = new Audit(config);
        audit.api = api;
        audit.logger = logger;
        return audit;
    }



    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async processOrder(order: any) {
        const orderId = order.id;
        await this.sleep(this.config.sleepTime);

        const discrepancies = await this.compareWeights(orderId);
        let hasChargedWeight = false;
        let totalActualWeight = 0;
        let totalChargedWeight = 0;

        for (const discrepancy of discrepancies) {
            if (typeof discrepancy.chargedWeight === 'number' && typeof discrepancy.actualWeight === 'number') {
                totalActualWeight += discrepancy.actualWeight;
                totalChargedWeight += discrepancy.chargedWeight;
                hasChargedWeight = true;
            } else {
                this.logger.log(`Invalid weights found: ${JSON.stringify(discrepancy)}`);
            }
        }

        if (discrepancies.length > 0) {
            this.logger.log(`Discrepancies found for Order ID ${orderId}: ${JSON.stringify(discrepancies)}`);
        } else {
            this.logger.log(`No discrepancies found for Order ID ${orderId}`);
        }

        return { hasChargedWeight, totalActualWeight, totalChargedWeight };
    }

    public async runAudit() {
        const orders = await this.api.getOrders();

        let totalActualWeight = 0;
        let totalChargedWeight = 0;
        let totalOrders = 0;
        let ordersWithNullChargedWeight = 0;
        let ordersWithChargedWeight = 0;

        for (const order of orders) {
            totalOrders++;
            const { hasChargedWeight, totalActualWeight: orderActualWeight, totalChargedWeight: orderChargedWeight } = await this.processOrder(order);
            totalActualWeight += orderActualWeight;
            totalChargedWeight += orderChargedWeight;

            if (hasChargedWeight) {
                ordersWithChargedWeight++;
            } else {
                ordersWithNullChargedWeight++;
            }
        }

        this.logSummary(totalOrders, ordersWithChargedWeight, ordersWithNullChargedWeight, totalActualWeight, totalChargedWeight);
    }

    public async compareWeights(orderId: number): Promise<{ shipmentId: number, chargedWeight: number, actualWeight: number }[]> {
        const discrepancies: { shipmentId: number, chargedWeight: number, actualWeight: number }[] = [];
        const orderShipments = await this.api.getShipmentsForOrder(orderId);

        for (const shipment of orderShipments) {
            const discrepancy = await this.compareShipmentWeight(shipment);
            if (discrepancy) {
                discrepancies.push(discrepancy);
            }
        }
        return discrepancies;
    }

    private async calculateActualWeight(products: any[]): Promise<number> {
        let actualWeight = 0;
        for (const product of products) {
            let isNegativeId = false;
            if (product.id > 0) {
                const inventoryItem = await this.api.getInventoryItem(product.id);
                actualWeight += inventoryItem.dimensions.weight * product.quantity;
            } else if (product.inventory_items && product.inventory_items.length > 0) {
                isNegativeId = true;
                for (const inventoryItemData of product.inventory_items) {
                    const inventoryItem = await this.api.getInventoryItem(inventoryItemData.id);
                    const quantity = inventoryItemData.quantity || product.quantity;
                    actualWeight += inventoryItem.dimensions.weight * quantity;

                    this.logger.debug(`
                    ------------------------------
                    was negative id: ${isNegativeId}
                    product id: ${product.id}
                    inventory id: ${inventoryItem.id}
                    quantity: ${quantity}
                    individual weight: ${inventoryItem.dimensions.weight}
                    combined weight: ${inventoryItem.dimensions.weight * quantity}
                    ------------------------------
          `);
                }
            } else {
                this.logger.log('Invalid product data: ' + JSON.stringify(product));
            }
        }
        return actualWeight;
    }
    private async compareShipmentWeight(shipment: any): Promise<{ shipmentId: number, chargedWeight: number, actualWeight: number } | null> {
        const shipmentWeight = shipment.measurements?.total_weight_oz;
        const actualWeight = await this.calculateActualWeight(shipment.products);
        if (shipmentWeight !== actualWeight && shipmentWeight !== null && actualWeight !== null) {
            return {
                shipmentId: shipment.id,
                chargedWeight: shipmentWeight,
                actualWeight,
            };
        }
        return null;
    }

    private logSummary(totalOrders: number, ordersWithChargedWeight: number, ordersWithNullChargedWeight: number, totalActualWeight: number, totalChargedWeight: number) {
        this.logger.log(`
        
        ------------------------------
        ------------------------------
        ------------------------------
        --                         --
        --     AUDIT SUMMARY       --
        --                         --
        ------------------------------
        ------------------------------
        ------------------------------
        
        `)
        this.logger.log(`Total Orders: ${totalOrders}`);
        this.logger.log(`Orders with Charged Weight: ${ordersWithChargedWeight}`);
        this.logger.log(`Orders with Null Charged Weight: ${ordersWithNullChargedWeight}`);
        this.logger.log(`Total Actual Weight: ${totalActualWeight}`);
        this.logger.log(`Total Charged Weight: ${totalChargedWeight}`);

        if (totalChargedWeight > 0) {
            const overchargedWeight = totalChargedWeight - totalActualWeight;
            const overchargedPercentage = (totalChargedWeight / overchargedWeight) * 100;
            this.logger.log(`Overcharged Weight: ${overchargedWeight}`);
            this.logger.log(`Overcharged Percentage: ${overchargedPercentage.toFixed(2)}%`);
        } else {
            this.logger.log('No charged weight to calculate overcharge percentage.');
        }
    }
}
