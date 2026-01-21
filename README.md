# ssimple Bug Report SDK

A bug reporting and user feedback platform with session replay capabilities, built with Next.js, TypeScript, and Firebase. This is an evolution of the ssimple Screen Recorder.

**[Live Demo](https://ssimple-report.web.app/)**

---

## Overview

Bug reporting tool that enables developers to embed a customizable widget into their applications. When users report issues, the platform captures:

- **Full session recordings** using rrweb (replay web sessions with pixel-perfect accuracy)
- **Screenshots** of the exact moment issues occur
- **Console logs** with timestamps for debugging
- **Network request traces** for API debugging
- **Device information** for environment context
- **File attachments** for additional context

---

## Tech Stack

### Frontend Framework
- **Next.js 13.4.12** - React framework with SSR, API routes, and file-based routing
- **React 18.2.0** - UI library with hooks and concurrent features
- **TypeScript 5.0.4** - Static type checking and enhanced IDE support

### Styling & UI
- **Tailwind CSS 3.2.4** - Utility-first CSS framework with JIT compilation
- **PostCSS** - CSS transformations (import, autoprefixer)
- **Font Awesome 5** - Vector icon library

### File Management
- **FilePond 4.30.4** - Advanced file upload with drag-and-drop
- **FilePond Plugins:**
  - Image preview & EXIF orientation handling
  - Media preview for videos
  - File type validation
  - File size validation (10MB limit)

### Session Recording & Replay
- **rrweb 2.0.0-alpha.4** - Records DOM mutations, interactions, and events
- **rrweb-player 1.0.0-alpha.4** - Video-like playback of recorded sessions

### Backend & Database
- **Firebase 9.9.2** - Backend-as-a-Service platform
  - **Firestore** - NoSQL document database
  - **Firebase Storage** - File storage for recordings and screenshots
  - **Firebase Authentication** - Email/password authentication
  - **Firebase Hosting** - Static site hosting and CDN

### Communication & Email
- **Resend 1.1.0** - Modern email API for transactional emails
- **React Email** - React components for email templates

### Form Handling & Validation
- **React Hook Form 7.43.1** - Performant form library with validation
- **DOMPurify 3.0.6** - XSS sanitization for user-generated content

### Utilities
- **uid 2.0.2** - Unique ID generation
- **html-react-parser** - Safe HTML parsing to React elements
- **match-sorter** - Intelligent sorting and filtering

---

## Project Structure

```
ssimple-bug-report/
├── src/
│   ├── pages/                          # Next.js file-based routing
│   │   ├── _app.tsx                   # App wrapper with AuthContext provider
│   │   ├── _document.tsx              # Custom HTML document structure
│   │   ├── index.tsx                  # Public landing page with demo
│   │   ├── login.tsx                  # Firebase auth login page
│   │   ├── widget.tsx                 # Bug report widget (iframe content)
│   │   ├── api/
│   │   │   └── send-email.ts          # Resend email API endpoint
│   │   └── admin/
│   │       ├── index.tsx              # Analytics dashboard with charts
│   │       ├── settings.tsx           # Account settings & branding
│   │       └── issues/
│   │           └── index.tsx          # Bug reports list & detail view
│   │
│   ├── components/                     # Reusable React components
│   │   ├── ProtectedRoute.tsx         # HOC for authenticated routes
│   │   ├── Sidebar.tsx                # Admin navigation sidebar
│   │   ├── Loading.tsx                # Loading spinner component
│   │   └── Linkify.tsx                # Auto-detect URLs and linkify
│   │
│   ├── context/                        # React Context providers
│   │   └── AuthContext.js             # Firebase auth state management
│   │
│   ├── config/                         # Configuration files
│   │   └── firebase.js                # Firebase SDK initialization
│   │
│   ├── utils/                          # Utility functions & types
│   │   └── types.ts                   # TypeScript interfaces
│   │
│   └── styles/
│       └── globals.css                # Global styles & Tailwind imports
│
├── public/                             # Static assets
│   ├── ssimpleSdk.js                  # Client-side SDK (74KB minified)
│   └── ...                            # Images, icons, fonts
│
├── Configuration Files:
│   ├── next.config.js                 # Next.js build configuration
│   ├── tailwind.config.js             # Tailwind CSS customization
│   ├── postcss.config.js              # PostCSS plugin pipeline
│   ├── tsconfig.json                  # TypeScript compiler options
│   ├── firebase.json                  # Firebase hosting configuration
│   └── .firebaserc                    # Firebase project aliases
│
└── package.json                        # Dependencies and scripts
```

---

## Features

### 1. Session Recording with rrweb

**Implementation:** [src/pages/widget.tsx](src/pages/widget.tsx)

```typescript
// Start recording with console and network capture
const stopFn = rrweb.record({
  emit(event) {
    events.push(event);  // Store events for later upload
  },
  recordConsole: true,    // Capture console.log/warn/error
  recordNetwork: true,    // Capture fetch/XHR requests
  sampling: {
    canvas: 15,           // Canvas recording at 15 FPS
    scroll: 150,          // Throttle scroll events
  },
  slimDOMOptions: {
    script: true,         // Remove script content for security
    comment: true,        // Remove HTML comments
  }
});

// Stop recording and process events
stopFn();
const blob = new Blob([JSON.stringify(events)], { type: 'application/json' });
// Upload to Firebase Storage
```

**Technical Details:**
- Captures DOM mutations, user interactions, viewport changes
- Records console logs with timestamps relative to session start
- Tracks network requests with status codes and timing
- Serializes events to JSON for storage efficiency
- Playback uses rrweb-player for video-like experience

### 2. Bug Reporting Widget

**Embedding:** [public/ssimpleSdk.js](public/ssimpleSdk.js)

```html
<!-- External site integration -->
<script>
(function(window, document) {
  window.ssimple = {};
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://your-domain.com/ssimpleSdk.js';
  document.head.appendChild(script);

  script.onload = function() {
    ssimple.init({
      appId: 'YOUR_APP_ID',      // Unique account identifier
      btnColor: '#6366f1',        // Custom button color
      hideBtn: false              // Show/hide default button
    });
  };
})(window, document);
</script>

<!-- Add data attribute to any button -->
<button data-ssimple-widget>Report Bug</button>
```

**Widget Features:**
- Loads in isolated iframe to prevent style conflicts
- Automatic session recording on button click
- Screenshot capture via HTML5 Canvas API
- File upload with validation (5 files max, 10MB each)
- Responsive design (mobile & desktop)

### 3. Admin Dashboard Analytics

**Implementation:** [src/pages/admin/index.tsx](src/pages/admin/index.tsx)

```typescript
// Chart.js registration (tree-shaking optimization)
ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend
);

// Data aggregation from Firestore
const aggregateData = (issues: IssueReport[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toLocaleDateString();
  }).reverse();

  const counts = last7Days.map(date =>
    issues.filter(issue =>
      new Date(issue.created_at).toLocaleDateString() === date
    ).length
  );

  return { labels: last7Days, data: counts };
};
```

**Chart Types:**
- Line chart: Issues over time (7-day trend)
- Bar chart: Issues by status (open, in-progress, resolved)
- Doughnut chart: Issues by type (bug, feature, feedback)

---

## 🚀 Setup & Development

### Prerequisites

- **Node.js** 16.x or higher
- **npm** 8.x or higher
- **Firebase account** (free tier works)
- **Resend account** (for email notifications)

### Environment Variables

Create `.env.local` in the project root:

```bash
# Firebase Configuration
NEXT_PUBLIC_apiKey=
NEXT_PUBLIC_authDomain=
NEXT_PUBLIC_projectId=
NEXT_PUBLIC_storageBucket=
NEXT_PUBLIC_messagingSenderId=
NEXT_PUBLIC_appId=
NEXT_PUBLIC_measurementId=

# Resend Email API
RESEND_API_KEY=
```

### Installation

```bash
# Clone the repository
git clone https://github.com/jyw3084/ssimple-bug-report.git
cd ssimple-bug-report

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)