import dotenv from "dotenv"
import app from "./app.js";

const port = process.env.PORT || 3000;

dotenv.config({
    path: "./.env",
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
});




