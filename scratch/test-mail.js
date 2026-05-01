import { sendPasswordResetEmail } from "../lib/mail.js";
import dotenv from "dotenv";
dotenv.config();

async function testMail() {
    console.log("Starting test mail...");
    try {
        await sendPasswordResetEmail("ooemir23@gmail.com", "test-token-123");
        console.log("Test mail sent successfully!");
    } catch (error) {
        console.error("Test mail failed:", error);
    }
}

testMail();
