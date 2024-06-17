import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { PrismaClient } from "@prisma/client";
import { hash } from 'bcrypt';
import * as bcrypt from 'bcrypt';  // Using bcrypt for password hashing

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

// Custom error handling middleware
app.onError((err, c) => {
  console.error("Unhandled error:", err);

  if (err instanceof Error && err.message.includes('P2002')) {
    return c.json({ message: "Email already exists" }, 409);
  }

  return c.json({ message: "Internal server error" }, 500);
});

app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    
    // Hash the password using bcrypt
    const bcryptHash = await bcrypt.hash(body.password, 10);  // Use bcrypt.hash instead of Bun.password.hash

    // Create user in the database
    const user = await prisma.user.create({
      data: {
        email: body.email,
        hashedPassword: bcryptHash,
      },
    });

    return c.json({ message: "User registered successfully", user }, 201);
  } catch (error) {
    console.error("Error occurred during user registration:", error);
    // Use the custom error handling middleware
    throw error;
  }
});

const port = 3000;
console.log("The server is running on port", port);

serve({
  fetch: app.fetch,
  port,
});
