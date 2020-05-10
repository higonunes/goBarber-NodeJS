import { Router } from 'express';

import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';

import authMiddlewares from './app/middlewares/auth';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvaliableController from './app/controllers/AvaliableController';

const routes = new Router();
const upload = multer(multerConfig);

// POST
routes.post('/users', UserController.store);
routes.post('/login', SessionController.store);

routes.use(authMiddlewares);

// GET
routes.get('/providers', ProviderController.index);
routes.get('/providers/:providerId/avaliables', AvaliableController.index);
routes.get('/schedule', ScheduleController.index);
routes.get('/appointments', AppointmentController.index);
routes.get('/notifications', NotificationController.index);

// POST
routes.post('/appointments', AppointmentController.store);
routes.post('/files', upload.single('file'), FileController.store);

// PUT
routes.put('/users', UserController.update);
routes.put('/notifications/:id', NotificationController.update);

// DELETE
routes.delete('/appointments/:id', AppointmentController.delete);

export default routes;
