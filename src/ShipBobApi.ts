import axios from 'axios';
import { config } from 'dotenv';
import { Logger } from './Logger';

config();

export class ShipBobAPI {
  private baseURL: string = 'https://api.shipbob.com/1.0';
  private token: string;
  private channelID: number | null = null;

  private logger: Logger;

  constructor(token: string, logger: Logger) {
    this.token = token;
    this.logger = logger;
  }

  public static async create(token: string, logger: Logger): Promise<ShipBobAPI> {
    const api = new ShipBobAPI(token, logger);
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
      return response.data.id;
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

}