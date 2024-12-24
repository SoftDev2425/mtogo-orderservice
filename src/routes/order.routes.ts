import orderController from '../controllers/order.controller';
import { requireCustomer } from '../middlewares/role';
import express from 'express';

const router = express.Router();

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
