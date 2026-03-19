import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Read Firebase config
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firestoreDatabaseId = "(default)";
let projectId = "";

try {
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    firestoreDatabaseId = config.firestoreDatabaseId || "(default)";
    projectId = config.projectId;
  }
} catch (e) {
  console.error("Could not read firebase config", e);
}

let db: admin.firestore.Firestore | null = null;

function getDb(): admin.firestore.Firestore {
  if (!db) {
    try {
      admin.initializeApp({
        projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT,
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
    db = getFirestore(admin.app(), firestoreDatabaseId);
  }
  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse JSON bodies
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API route for theories
  app.get("/api/theories", async (req, res) => {
    try {
      const db = getDb();
      const snapshot = await db.collection("theories").orderBy("createdAt", "desc").limit(10).get();
      const theories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ theories });
    } catch (error: any) {
      console.error("Error fetching theories:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint for creating a theory (and forking)
  app.post("/api/theories", async (req, res) => {
    try {
      const db = getDb();
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

      res.json({ success: true, id: newTheoryRef.id });
    } catch (error: any) {
      console.error("Error creating theory:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint for upvoting a theory
  app.post("/api/theories/:id/upvote", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
      }

      const theoryRef = db.collection("theories").doc(id);
      const upvoteRef = db.collection(`theories/${id}/upvotes`).doc(userId);

      const upvoteSnap = await upvoteRef.get();
      if (upvoteSnap.exists) {
        return res.status(400).json({ error: "Already upvoted" });
      }

      const batch = db.batch();
      batch.update(theoryRef, { upvotes: admin.firestore.FieldValue.increment(1) });
      batch.set(upvoteRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
      await batch.commit();

      res.json({ success: true, message: "Upvoted successfully" });
    } catch (error: any) {
      console.error("Error upvoting theory:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint for adding a comment
  app.post("/api/theories/:id/comments", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { content, authorId, authorName, authorPhoto } = req.body;

      if (!content || !authorId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

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

      res.json({ success: true, id: commentRef.id });
    } catch (error: any) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint for adding a reaction to a theory
  app.post("/api/theories/:id/react", async (req, res) => {
    try {
      const db = getDb();
      const { id } = req.params;
      const { reactionType, userId } = req.body; // In a real app, userId should come from a verified auth token

      if (!reactionType || !userId) {
        return res.status(400).json({ error: "Missing reactionType or userId" });
      }

      const theoryRef = db.collection("theories").doc(id);
      
      // Use a transaction or FieldValue.increment to update the reaction count
      await theoryRef.update({
        [`reactions.${reactionType}`]: admin.firestore.FieldValue.increment(1)
      });

      res.json({ success: true, message: `Added ${reactionType} reaction` });
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
