# NetGraph – Intelligent Social Media Network Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.0-green)
![React](https://img.shields.io/badge/React-18-blue)

NetGraph is a scalable social media networking platform designed to simulate real-world user connections using graph data structures and modern full-stack development practices. 

Instead of treating connections as basic foreign keys in a relational database, NetGraph utilizes **Breadth-First Search (BFS)** and **Depth-First Search (DFS)** algorithms over graph data structures to intelligently suggest friends, map out connection paths, and model communities.

## System Architecture

*(Insert Architecture Diagram Here - draw.io)*
- **Frontend**: React.js / Vite / TailwindCSS
- **Backend API**: Java Spring Boot 3 / Spring Security
- **Real-Time Communication**: Spring WebSockets / STOMP
- **Data Persistence**: PostgreSQL

## Business & Technical Highlights

- **Graph Recommendation Engine**: Processes intelligent friend suggestions and models connection paths using BFS/DFS Graph Traversals over relational data.
- **Modern Security**: Complete OAuth2 authentication flow (Google Sign-In) with stateless JWT session management and Spring Security Role-Based Access Control (RBAC). 
- **Real-Time WebSockets**: Bi-directional messaging layer built with Spring WebSockets and STOMP, supporting instant chat and typing indicators.
- **Admin Dashboard**: Analytics pipeline grouping user engagement metrics into actionable visualizations.
- **Sentiment & Content Generation**: Built-in keyword-based sentiment analysis engine to evaluate post sentiment, alongside an integration stub for auto-generating engaging post ideas.

## Quick Start

### 1. Backend Setup

```bash
cd backend
# Make sure you have a PostgreSQL database running and configured in application.properties
./mvnw spring-boot:run
```

**API Documentation (Swagger UI)**:
Once the backend is running, navigate to `http://localhost:8080/swagger-ui.html` for complete interactive API documentation.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React App will be accessible at `http://localhost:5173`.

---
*Created as an advanced showcase of transitioning Data Structures and Algorithms into real-world Full-Stack Engineering.*
