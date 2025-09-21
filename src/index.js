import dotenv from "dotenv"
import app from "./app.js";
import connectDB from "./db/index.js";
const port = process.env.PORT || 3000;



dotenv.config({
    path: "./.env",
});

connectDB()
.then(()=>{
  app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
});
})
.catch((err)=>{
  console.error("mongoDB Connection Error",err)
  process.exit(1)
})




