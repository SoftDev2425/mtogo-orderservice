import orderController from '../controllers/order.controller';
import { requireCustomer } from '../middlewares/role';
import express from 'express';
import { Request, Response } from 'express';
import client from '../grpc/restaurantClient';

const router = express.Router();

async function getRestaurantDetails(restaurantId: string) {
  return new Promise((resolve, reject) => {
    client.GetRestaurantDetails(
      { restaurantId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any, response: any) => {
        if (error) {
          console.error('Error calling restaurant-service:', error);
          reject(error);
          return;
        }
        console.log('Response from restaurant-service:', response);
        resolve(response);
      },
    );
  });
}

router.get('/tester', requireCustomer, (_req: Request, res: Response) => {
  getRestaurantDetails('1')
    .then(response => {
      res.json(response);
    })
    .catch(error => {
      res.status(500).json({ error });
    });
});

// create order
router.post('/', requireCustomer, orderController.handleCreateOrder);

// get order by id
// router.get('/:id', requireCustomer, orderController.handleGetOrderById);

// get order status
// router.get('/:id/status', requireCustomer, orderController.handleGetOrderStatus);

// update order status
// router.put('/:id/status', requireCustomer, orderController.handleUpdateOrderStatus);

// cancel order
// router.delete('/:id', requireCustomer, orderController.handleCancelOrder);

// get all orders - for mtogo management
// router.get('/', orderController.handleGetAllOrders);

// get all orders - for customer
// router.get('/customer', requireCustomer, orderController.handleGetCustomerOrders);

export default router;
