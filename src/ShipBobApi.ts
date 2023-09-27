import axios from 'axios';
import { config } from 'dotenv';
import { Logger } from './Logger';
import { AuditConfig } from './types';

config();

export class ShipBobAPI {
  private baseURL: string = 'https://api.shipbob.com/1.0';
  private token: string;
  private channelID: number | null = null;

  private config: AuditConfig;

  private logger: Logger;

  constructor(token: string, logger: Logger, config: AuditConfig) {
    this.token = token;
    this.logger = logger;
    this.config = config;
  }

  public static async create(token: string, logger: Logger, config: AuditConfig): Promise<ShipBobAPI> {
    const api = new ShipBobAPI(token, logger, config);
    await api.initialize();
    return api;
  }

  private async initialize(): Promise<void> {
    this.channelID = await this.getChannelId();
    if (this.channelID === null) {
      throw new Error('Failed to retrieve Channel ID');
    }
  }

  private async getChannelId(): Promise<number | null> {
    try {
      const response = await axios.get(`${this.baseURL}/channel`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      console.log(`
      
        channel id is ${JSON.stringify(response.data, null, 4)}
      `);
      const id = response.data
        .filter((channel: any) => channel.name === this.config.channelName)[0].id;
      console.log(`----- ${id} ----`);
      return id;
    } catch (error) {
      this.logger.log('Error fetching channel ID: ' + error);
      return null;
    }
  }


  private async makeRequest(endpoint: string, params?: any) {
    if (this.channelID === null) {
      throw new Error('Channel ID has not been initialized');
    }
    const config = {
      headers: {
        Authorization: `Bearer ${this.token}`,
        shipbob_channel_id: this.channelID,
      },
      params,
    };
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, config);
      return response.data;
    } catch (error) {
      let errorMsg = `Error making request to endpoint: ${endpoint} with params: ${JSON.stringify(params)}`;
      if (error.response) {
        errorMsg += `\nServer responded with status: ${error.response.status} and data: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMsg += `\nNo response received. Request data: ${JSON.stringify(error.request)}`;
      } else {
        errorMsg += `\nError message: ${error.message}`;
      }
      this.logger.log(errorMsg);
      throw error;
    }
  }




  public async getOrders(page: number = 1, limit: number = 50): Promise<any[]> {
    let allOrders: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const params = { Page: page, Limit: limit };
      try {
        const orders = await this.makeRequest('/order', params);
        if (orders.length > 0) {
          allOrders = allOrders.concat(orders);
          page++;  // Increment the page number for the next request
        } else {
          hasMore = false;  // No more orders, exit the loop
        }
      } catch (error) {
        this.logger.log('Error fetching orders on page ' + page + ': ' + error);
        throw error;  // Re-throw the error to be handled by the calling code
      }
    }

    return allOrders;
  }

  public async getShipmentsForOrder(orderId: number): Promise<any> {
    // console.log('Fetching shipments for order ID:', orderId);  // Log the order ID
    try {
      const order = await this.makeRequest(`/order/${orderId}`);
      // console.log('Fetched order:', order);  // Log the fetched order
      return order.shipments;
    } catch (error) {
      this.logger.log('Error fetching shipments for order ID: ' + orderId + ' ' + error);
      throw error;  // Re-throw the error to be handled by the calling code
    }
  }



  public async getProducts(page: number = 1, limit: number = 50): Promise<any> {
    const params = { Page: page, Limit: limit };
    return await this.makeRequest('/product', params);
  }

  public async getProduct(productId: number): Promise<any> {
    return await this.makeRequest(`/product/${productId}`);
  }

  public async getInventoryItem(inventoryId: number): Promise<any> {
    return await this.makeRequest(`/inventory/${inventoryId}`);
  }

  public async estimateCost(order: any): Promise<number> {
    const endpoint = `${this.baseURL}/order/estimate`;
    const payload = {
      // shipping_methods: shippingMethods,
      address: {
        address1: order.recipient.address.address1,
        address2: order.recipient.address.address2,
        company_name: order.recipient.name,
        city: order.recipient.address.city,
        state: order.recipient.address.state,
        country: order.recipient.address.country,
        zip_code: order.recipient.address.zip_code,
      },
      products: order.products.map((product: any) => ({
        id: product.id,
        reference_id: product.reference_id,
        quantity: product.quantity,
      })),
    };



    const config = {
      headers: {
        Authorization: `Bearer ${this.token}`,
        shipbob_channel_id: this.channelID,
      },
    };

    console.log("Channel id");
    console.log(this.channelID);

    try {
      const response = await axios.post(endpoint, payload, config);
      const estimatedPrice = response.data.estimates[0]?.estimated_price || 0;
      return estimatedPrice;
    } catch (error) {
      let errorMsg = 'Error estimating cost: ';
      errorMsg += `\nEndpoint: ${endpoint}`;
      errorMsg += `\nPayload: ${JSON.stringify(payload, null, 2)}`;
      errorMsg += `\nConfig: ${JSON.stringify(config, null, 2)}`;

      if (error.response) {
        errorMsg += `\nServer responded with status: ${error.response.status} and data: ${JSON.stringify(error.response.data, null, 2)}`;
      } else if (error.request) {
        errorMsg += `\nNo response received. Request data: ${JSON.stringify(error.request, null, 2)}`;
      } else {
        errorMsg += `\nError message: ${error.message}`;
      }

      this.logger.log(errorMsg);
      throw error;
    }
  }

  public async getShippingMethods(page: number = 1, limit: number = 50): Promise<any[]> {
    const endpoint = `/shippingmethod`;
    const params = { Page: page, Limit: limit };
    try {
      const response = await this.makeRequest(endpoint, params);
      return response;
    } catch (error) {
      let errorMsg = `Error fetching shipping methods: `;
      if (error.response) {
        errorMsg += `\nServer responded with status: ${error.response.status} and data: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMsg += `\nNo response received. Request data: ${JSON.stringify(error.request)}`;
      } else {
        errorMsg += `\nError message: ${error.message}`;
      }
      this.logger.log(errorMsg);
      throw error;
    }
  }

}