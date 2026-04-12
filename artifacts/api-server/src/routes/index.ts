import { Router, type IRouter } from "express";
import healthRouter from "./health";
import placesRouter from "./places";
import eventsRouter from "./events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(placesRouter);
router.use(eventsRouter);

export default router;
