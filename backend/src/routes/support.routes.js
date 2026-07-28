import express from 'express';
import { createSupportTicket, listSupportTickets, updateSupportTicket } from '../controllers/supportController.js';

const router = express.Router();

router.post('/tickets', createSupportTicket);
router.get('/tickets', listSupportTickets);
router.patch('/tickets/:ticketId', updateSupportTicket);

export default router;
