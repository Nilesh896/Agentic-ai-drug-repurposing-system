import express from "express";
import cors from "cors";
import path from "path";

import routes from "./routes";
import { env } from "./config/env";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    "/uploads",
    express.static(
        path.join(process.cwd(), "uploads")
    )
);

app.use("/api/v1", routes);

app.use(errorMiddleware);

app.listen(env.PORT, () => {
    console.log(
        `Server running on port ${env.PORT}`
    );
});