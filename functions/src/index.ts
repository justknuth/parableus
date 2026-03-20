import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import express from "express";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Define the secret so Firebase knows to fetch it from Secret Manager
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// 1. Setup Global Options (Cost Control)
setGlobalOptions({ maxInstances: 10 });

// 2. Database Initialization Logic
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firestoreDatabaseId = "(default)";

try {
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    firestoreDatabaseId = config.firestoreDatabaseId || "(default)";
  }
} catch (e) {
  console.error("Could not read firebase config", e);
}

// Initialize Admin SDK
admin.initializeApp();
const db = getFirestore(admin.app(), firestoreDatabaseId);

// 3. Express App Setup
const app = express();
app.use(express.json());

// --- API ROUTES ---

// Health Check
app.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

// Chat Route (Proxy for Gemini)
app.post("/chat", async (req, res) => {
  try {
    const { contents } = req.body;

    if (!contents) {
      return res.status(400).json({ error: "Missing contents" });
    }

    // Initialize the AI securely using the value pulled from the vault
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    const response = await ai.models.generateContent({
      model: 'gemma-3-27b-it',
      contents: contents,
      config: {
        temperature: 1.3,
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error generating chat response:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
});

// Fetch Theories
app.get("/theories", async (req, res) => {
  try {
    const snapshot = await db.collection("theories").orderBy("createdAt", "desc").limit(10).get();
    const theories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json({ theories });
  } catch (error: any) {
    console.error("Error fetching theories:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Create Theory (and Fork)
app.post("/theories", async (req, res) => {
  try {
    const { title, content, category, authorId, authorName, authorPhoto, parentId, parentTitle } = req.body;

    if (!title || !content || !category || !authorId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const theoryData: any = {
      title,
      content,
      category,
      authorId,
      authorName: authorName || 'Anonymous',
      authorPhoto: authorPhoto || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      upvotes: 0,
      commentCount: 0,
      forkCount: 0,
    };

    if (parentId && parentTitle) {
      theoryData.parentId = parentId;
      theoryData.parentTitle = parentTitle;
    }

    const batch = db.batch();
    const newTheoryRef = db.collection("theories").doc();
    batch.set(newTheoryRef, theoryData);

    if (parentId) {
      const parentRef = db.collection("theories").doc(parentId);
      batch.update(parentRef, { forkCount: admin.firestore.FieldValue.increment(1) });
    }

    await batch.commit();
    return res.json({ success: true, id: newTheoryRef.id });
  } catch (error: any) {
    console.error("Error creating theory:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Upvote Theory
app.post("/theories/:id/upvote", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const theoryRef = db.collection("theories").doc(id);
    const upvoteRef = db.collection(`theories/${id}/upvotes`).doc(userId);

    const upvoteSnap = await upvoteRef.get();
    if (upvoteSnap.exists) return res.status(400).json({ error: "Already upvoted" });

    const batch = db.batch();
    batch.update(theoryRef, { upvotes: admin.firestore.FieldValue.increment(1) });
    batch.set(upvoteRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    await batch.commit();

    return res.json({ success: true, message: "Upvoted successfully" });
  } catch (error: any) {
    console.error("Error upvoting theory:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Add Comment
app.post("/theories/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, authorId, authorName, authorPhoto } = req.body;

    if (!content || !authorId) return res.status(400).json({ error: "Missing required fields" });

    const batch = db.batch();
    const commentRef = db.collection(`theories/${id}/comments`).doc();
    
    batch.set(commentRef, {
      theoryId: id,
      content,
      authorId,
      authorName: authorName || 'Anonymous',
      authorPhoto: authorPhoto || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const theoryRef = db.collection("theories").doc(id);
    batch.update(theoryRef, { commentCount: admin.firestore.FieldValue.increment(1) });

    await batch.commit();
    return res.json({ success: true, id: commentRef.id });
  } catch (error: any) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Add Reaction
app.post("/theories/:id/react", async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType, userId } = req.body;

    if (!reactionType || !userId) return res.status(400).json({ error: "Missing reactionType or userId" });

    const theoryRef = db.collection("theories").doc(id);
    await theoryRef.update({
      [`reactions.${reactionType}`]: admin.firestore.FieldValue.increment(1)
    });

    return res.json({ success: true, message: `Added ${reactionType} reaction` });
  } catch (error: any) {
    console.error("Error adding reaction:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Add the secret requirement to the exported function
export const api = onRequest({ maxInstances: 10, secrets: [geminiApiKey] }, app);