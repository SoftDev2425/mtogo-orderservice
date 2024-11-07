import express from 'express';
import userController from '../controllers/user.controller';

const router = express.Router();

router.get('/:id', userController.handleGetUserById);
router.get('/', userController.handleGetAllUsers);
router.post('/', userController.handleCreateUser);

export default router;
