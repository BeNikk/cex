import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/api/v1/test", (req: Request, res: Response) => {
  try {
    res.send("Test route working!");
  } catch (error) {
    console.log("Test route failed");
    res.status(500).json({ message: "Internal server error in Test route" });
    return;
  }
})

app.listen(3000);
