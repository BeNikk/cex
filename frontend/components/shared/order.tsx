
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/lib/request";

type OrderProps = {
  market: string;
  userId?: string;
};

export default function Order({ market, userId = "1" }: OrderProps) {
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleOrder = async (side: "BUY" | "SELL") => {
    try {
      setLoading(true);
      setError("");
      setOrderResult(null);

      const postData = {
        market,
        price,
        quantity: amount,
        side,
        userId,
      };

      const res = await axios.post(`${BASE_URL}/order`, postData);
      const data = res.data;

      setOrderResult({ ...data, side });
      console.log("Order response:", data);
    } catch (err) {
      console.error(err);
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#14151b] rounded-2xl shadow-lg w-[360px] p-5 flex flex-col gap-5 text-white border border-gray-800">
      <h2 className="text-lg font-semibold tracking-wide text-gray-100">Place Order</h2>

      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#1c1d23] rounded-lg border border-gray-700">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-[#1e2e1f] data-[state=active]:text-white text-gray-300 hover:bg-green-800 transition-all"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-[#361f1f] data-[state=active]:text-white text-gray-300 hover:bg-red-800 transition-all"
          >
            Sell
          </TabsTrigger>
        </TabsList>
        <TabsContent value="buy">
          <div className="flex flex-col gap-3 mt-3">
            <label className="text-sm text-gray-400">Price (USDC)</label>
            <Input
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-[#1c1d23] border-gray-700 text-gray-100 focus-visible:ring-0 focus:border-green-500"
            />

            <label className="text-sm text-gray-400">Amount (SOL)</label>
            <Input
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#1c1d23] border-gray-700 text-gray-100 focus-visible:ring-0 focus:border-green-500"
            />

            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>Total</span>
              <span>
                {price && amount
                  ? (parseFloat(price) * parseFloat(amount)).toFixed(2)
                  : "0.00"}{" "}
                USDC
              </span>
            </div>

            <Button
              onClick={() => handleOrder("BUY")}
              disabled={loading}
              className="bg-[#1e2e1f] hover:bg-green-800 w-full text-white font-medium rounded-lg mt-2"
            >
              {loading ? "Placing..." : "Place Buy Order"}
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="sell">
          <div className="flex flex-col gap-3 mt-3">
            <label className="text-sm text-gray-400">Price (USDC)</label>
            <Input
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-[#1c1d23] border-gray-700 text-gray-100 focus-visible:ring-0 focus:border-red-500"
            />

            <label className="text-sm text-gray-400">Amount (SOL)</label>
            <Input
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#1c1d23] border-gray-700 text-gray-100 focus-visible:ring-0 focus:border-red-500"
            />

            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>Total</span>
              <span>
                {price && amount
                  ? (parseFloat(price) * parseFloat(amount)).toFixed(2)
                  : "0.00"}{" "}
                USDC
              </span>
            </div>

            <Button
              onClick={() => handleOrder("SELL")}
              disabled={loading}
              className="bg-[#361f1f]] w-full text-white font-medium rounded-lg mt-2"
            >
              {loading ? "Placing..." : "Place Sell Order"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      {error && (
        <p className="text-center text-sm text-red-400 bg-red-900/20 p-2 rounded-lg">
          {error}
        </p>
      )}

      {orderResult && (
        <div
          className="mt-3"
        >
          <Card className="bg-[#1a1b21] border border-gray-700 text-gray-100">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 uppercase">
                  {orderResult.side}
                </span>
                <span className="text-xs text-gray-400">#{orderResult.orderId}</span>
              </div>

              <p className="text-sm">
                <span className="text-gray-400">Executed:</span>{" "}
                <span className="text-white font-medium">{orderResult.executed}</span>
              </p>

              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Fills:</p>
                <div className="bg-[#23242a] rounded-lg p-2 space-y-1">
                  {orderResult.fills && orderResult.fills.map((fill: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs text-gray-300"
                    >
                      <span>Price: {fill.price}</span>
                      <span>Qty: {fill.qty}</span>
                      <span>TradeID: {fill.tradeId}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

