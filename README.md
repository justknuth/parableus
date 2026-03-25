# Parableus

Parableus is a collaborative platform designed to spark human creativity, lateral thinking, and collective discovery. Inspired by the idea that a million everyday people working together might make discoveries that elude a single scientist, Parableus provides a space to share, discuss, and evolve theories across science, technology, philosophy, and the universe.

At the heart of Parableus is an integrated AI assistant powered by Gemini. This AI is purposely designed to wander the edges of thought—introducing highly speculative, unconventional, and slightly hallucinatory ideas to trigger new ways of thinking in its human collaborators.

## Features

* **Parableus AI Chat**: A clean, focused interface to converse with an AI that encourages lateral thinking and connects seemingly unrelated concepts.
* **Theory Categories**: Reddit-style forums divided into Science, Technology, Philosophy, Universe, and Miscellaneous.
* **Community Interaction**: Share your own theories, upvote intriguing ideas, and engage in discussions through comments.
* **Real-time Updates**: Powered by Firebase Firestore, ensuring you see new theories and comments instantly.
* **Google Authentication**: Secure and simple sign-in using Firebase Auth.
* **Immersive Design**: A dark, mysterious, and soft UI featuring deep browns and blacks, designed to reduce eye strain and foster deep thought.

## Tech Stack

* **Frontend**: React 19, Vite, React Router
* **Styling**: Tailwind CSS v4, Framer Motion (for smooth animations), Lucide React (icons)
* **Backend/Database**: Firebase (Firestore, Authentication)
* **AI Integration**: `@google/genai` SDK (Gemini 3.1 Pro Preview)

## Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* A Firebase project with Firestore and Google Authentication enabled
* A Google Gemini API Key

### Installation

1. **Clone the repository** (if running locally):
   ```bash
   git clone <repository-url>
   cd parableus
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

4. **Firebase Configuration**:
   Ensure your `firebase-applet-config.json` is present in the root directory with your Firebase project credentials:
   ```json
   {
     "apiKey": "...",
     "authDomain": "...",
     "projectId": "...",
     "appId": "...",
     "firestoreDatabaseId": "(default)"
   }
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Project Structure

* `/src/components/Chat.tsx`: The main AI interface where Parableus interacts with users.
* `/src/components/Categories.tsx`: The landing page for the theory forums.
* `/src/components/Feed.tsx`: The list view for theories within a specific category.
* `/src/components/TheoryDetail.tsx`: The detailed view of a theory, including upvotes and comments.
* `/src/firebase.ts`: Firebase initialization and authentication helpers.
* `/firestore.rules`: Security rules protecting the Firestore database.

## The Philosophy

Parableus embraces the unknown. It doesn't just seek the correct answer; it seeks the *interesting* answer. Let your mind wander.
