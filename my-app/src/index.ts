import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { PrismaClient } from "@prisma/client";
import { decode } from "hono/jwt";


const app = new Hono();
const prisma = new PrismaClient();

type Variables = { 
  secret: string;
};

app.use("/*", cors());

app.use(
  "/protected/*",
  jwt({
    secret: "mySecretKey",
  })
);

app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    
    // Hash the password
    const bcryptHash = await Bun.password.hash(body.password, {
      algorithm: "bcrypt",
      cost: 4, // number between 4-31
    });

    // Create user in the database
    const user = await prisma.user.create({
      data: {
        email: body.email,
        hashedPassword: bcryptHash,
      },
    });

    return c.json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error occurred during user registration:", error);

    if (error instanceof Error && error.message.includes('P2002')) {
      return c.json({ message: "Email already exists" });
    } else {
      return c.json({ message: "Internal server error" });
    }
  }
});

const port = 1632;
console.log("The server is running on port", port);

serve({
  fetch: app.fetch,
  port,
});
