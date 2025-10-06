
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
        this.bids.sort((a, b) => b.price - a.price);
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
        this.asks.sort((a, b) => a.price - b.price);
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
  getDepth() {
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    const bidsObj: { [key: string]: number } = {};
    const asksObj: { [key: string]: number } = {};

    for (let i = 0; i < this.bids.length; i++) {
      const order = this.bids[i]!;
      if (!bidsObj[order.price]) {
        bidsObj[order.price] = 0;
      }
      bidsObj[order.price]! += order.quantity;
    }

    for (let i = 0; i < this.asks.length; i++) {
      const order = this.asks[i]!;
      if (!asksObj[order.price]) {
        asksObj[order.price] = 0;
      }
      asksObj[order.price]! += order.quantity;
    }

    for (const price in bidsObj) {
      bids.push([price, bidsObj[price]!.toString()]);
    }

    for (const price in asksObj) {
      asks.push([price, asksObj[price]!.toString()]);
    }

    return {
      bids,
      asks
    };
  }
  cancelBuys(order: Order) {
    const index = this.bids.findIndex(x => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.bids[index]!.price;
      this.bids.splice(index, 1);
      return price
    }
  }

  cancelSells(order: Order) {
    const index = this.asks.findIndex(x => x.orderId === order.orderId);
    if (index !== -1) {
      const price = this.asks[index]!.price;
      this.asks.splice(index, 1);
      return price
    }
  }
  getOpenOrders(userId: string): Order[] {
    const asks = this.asks.filter(x => x.userId === userId);
    const bids = this.bids.filter(x => x.userId === userId);
    return [...asks, ...bids];
  }
}
