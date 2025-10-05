
export interface Order {
  price: number;
  quantity: number;
  side: Side;
  orderId: string;
  filled: number;
  userId: string;
}
enum Side {
  BUY = "BUY",
  SELL = "SELL"
}

//initialising an orderBook class for each market
export class OrderBook {
  bids: Order[];
  asks: Order[];
  baseAsset: string; // in SOL_USDC , SOL is the base 
  quoteAsset: string = "USDC"; // USDC in SOL_USDC
  lastTradeId: number;
  currentPrice: number;

  constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number) {
    this.bids = bids;
    this.asks = asks;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;
    this.baseAsset = baseAsset;

  }
  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }
  getSnap() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    }
  }

  matchBuys(order: Order) {
    const fills = [];
    let executed = 0;
    for (let i = 0; i < this.asks.length; i++) {
      const ask = this.asks[i]!;
      if (ask.price <= order.price && executed < order.quantity) {
        const filledQty = Math.min((order.quantity - executed), ask.quantity);
        executed += filledQty;
        ask.filled += filledQty;
        fills.push({
          price: ask.price.toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: ask.userId,
          marketOrderId: ask.orderId
        })
      }
    }
    for (let i = 0; i < this.asks.length; i++) {
      let ask = this.asks[i]!;
      if (ask.filled === ask.quantity) {
        this.asks.splice(i, 1);
        i--;
      }
    }
    return {
      fills,
      executed
    };
  }
  matchSells(order: Order) {
    const fills = [];
    let executed = 0;
    for (let i = 0; i < this.bids.length; i++) {
      const bid = this.bids[i]!;
      if (bid.price >= order.price && executed < order.quantity) {
        const filledQty = Math.min((order.quantity - executed), bid.quantity);
        executed += filledQty;
        bid.filled += filledQty;
        fills.push({
          price: bid.price.toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: bid.userId,
          marketOrderId: bid.orderId
        })
      }
    }
    for (let i = 0; i < this.bids.length; i++) {
      let bid = this.bids[i]!;
      if (bid.filled === bid.quantity) {
        this.bids.splice(i, 1);
        i--;
      }
    }
    return {
      fills,
      executed
    };

  }
  createOrder(order: Order) {
    try {
      if (order.side == "BUY") {
        const { executed, fills } = this.matchBuys(order)
        // if it is filled, we don't keep it in the orderbook 
        if (executed == order.quantity) {
          return {
            executed,
            fills
          }
        }
        // otherwise put in the orderbook
        this.bids.push(order);
        return {
          executed,
          fills
        };
      }
      else if (order.side == "SELL") {
        const { executed, fills } = this.matchSells(order);
        order.filled = executed;
        if (executed === order.quantity) {
          return {
            executed,
            fills
          }
        }
        this.asks.push(order);
        return {
          executed,
          fills
        }
      }
    } catch (error) {
      console.log("Error in creating order");
      return;
    }

  }
}
