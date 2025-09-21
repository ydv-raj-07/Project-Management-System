import express from "express";
import cors from "cors";

const app = express();


// basic configuration
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))

// cors comfiguration
app.use(cors({
  origin:process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
  credentials:true,
  methods:["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders:["Content-Type","Authorization"],
}),
);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/instagram",(req,res)=>{
    res.send("This is an Instagram page")
});

export default app;