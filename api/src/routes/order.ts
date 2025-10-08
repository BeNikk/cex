import { Request, Response, Router } from "express";
import { RedisManager } from "../redis/redis";

const orderRouter = Router();

orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { market, price, quantity, side, userId } = req.body;
    // in market orders, price should be coming from poller instead of user, for limit orders this is fine;
    const resp: any = await RedisManager.getInstance().sendAndWait({
      type: "CREATE_ORDER",
      data: {
        market,
        price,
        quantity,
        side,
        userId
      }
    })
    res.json(resp.payload);

  } catch (error) {
    console.log("Error in creating order");
    res.status(500).json({ message: "Internal server error in creating order" });
  }
})
orderRouter.delete('/', async (req: Request, res: Response) => {
  try {
    const { userId, orderId, market } = req.body;
    const response: any = await RedisManager.getInstance().sendAndWait({
      type: 'CANCEL_ORDER',
      data: {
        orderId,
        market,
        userId
      }
    });
    res.json(response.payload);
  } catch (error) {
    console.log("Error in deleting order", error);
  }
})

export default orderRouter;
