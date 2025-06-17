# Task 2: Membership Export Architecture

## 🎯 Goal

To design a stable and scalable asynchronous architecture for exporting user membership data to CSV files. The system must handle time-intensive operations without blocking the API, ensuring an optimal user experience and high reliability.

## 🏗️ Architecture Overview

The solution implements an event-driven, microservices architecture. It uses a message queue (**BullMQ**) for asynchronous job processing and an event stream (**Kafka**) for decoupled service communication. This design ensures high availability, fault tolerance, and horizontal scalability.

## 📊 Process Flow

1.  **Export Request**: A user requests an export. The API validates the request, enforces rate limits, and queues a job in **BullMQ**.
2.  **Immediate Response**: The API instantly returns a `202 Accepted` status with a `jobId` for tracking.
3.  **Asynchronous Processing**: The **Memberships Export Service** picks up the job, queries a **Read Replica Database**, generates a CSV, and uploads it to **S3**.
4.  **Event Publishing**: The service publishes an `ExportCompleted` event to a **Kafka** topic with the `userId` and S3 file key.
5.  **Email Notification**: The **Email Service** consumes the event, generates a secure pre-signed URL for the S3 file, and sends a download link to the user.

## 📋 Architectural Components

### 1. API Layer with Rate Limiting

- **Technology**: API Gateway or NestJS Throttler
- **Purpose**: Handles initial request validation, authentication (JWT/OAuth), and rate limiting.
- **Rationale**: Prevents API timeouts by offloading heavy work and provides a better user experience with an immediate response.

### 2. Message Queue (BullMQ)

- **Purpose**: Decouples the API from the background processing layer.
- **Rationale**: Manages traffic bursts gracefully and ensures reliability through built-in job tracking, prioritization, and automated retries with exponential backoff.

### 3. Memberships Export Service

- **Purpose**: Orchestrates the entire export workflow from database query to S3 upload.
- **Rationale**: Can be scaled horizontally based on queue depth, isolating the core business logic for better maintainability and failure isolation.

### 4. Data Storage Infrastructure

- **Read Replica Database**: Isolates export queries from production traffic, protecting primary database performance. Queries are optimized with indexes on `user_id`.
- **S3 Object Storage**: Provides durable, scalable, and cost-effective storage for CSV files, bypassing email attachment size limits.

### 5. Event Streaming (Kafka)

- **Purpose**: Facilitates decoupled, event-driven communication between services.
- **Rationale**: Enables multiple consumer services to react to events and allows for future extensibility without modifying the core export service.

### 6. Email Service

- **Purpose**: Consumes events from Kafka to generate and send notification emails with secure download links.
- **Rationale**: Follows the single-responsibility principle, allowing for independent scaling and easy integration with any email provider.

## 🚀 Scalability Strategies

1.  **Horizontal Scaling**: Export workers and Email Service consumers auto-scale based on queue depth and Kafka consumer lag, respectively.
2.  **Performance Optimizations**: This includes database query optimization, CSV streaming for large datasets, S3 multipart uploads, and connection pooling.
3.  **Resource Management**: Concurrency limits prevent system overload and circuit breakers protect against failures in external services.

## 🛡️ Reliability & Error Handling

### Error Handling Strategy

- **Export Processing Failures**: Jobs are retried 3 times with exponential backoff. Permanent failures are moved to a Dead Letter Queue (DLQ) for investigation, and the user is notified.
- **Email Delivery Failures**: The Email Service has its own retry logic and can be configured with fallback providers.
- **S3 Upload Failures**: The system attempts an immediate retry, potentially to a different region as a fallback.

### Monitoring & Alerts (CloudWatch)

- **Key Metrics Tracked**:
  - Queue depth, processing times, and failure rates.
  - Service health (CPU/memory usage, latency, error rates).
  - Kafka consumer lag and S3 upload performance.
- **Alerting**: Automated alarms trigger on critical events like excessive queue depth, high failure rates, or service availability dropping below certain treshold.

## 🔒 Security Considerations

1.  **Authentication & Authorization**: JWT/OAuth validation is enforced at the API Gateway. Users can only export their own data.
2.  **Data Protection**: Data is encrypted both in transit (TLS) and at rest (S3 Server-Side Encryption).
3.  **Secure Access**: Pre-signed URLs provide secure, time-limited access to files, preventing permanent public links.

### ⏱️ Time Estimation

| Phase                     | Time          |
| :------------------------ | :------------ |
| Planning                  | ~2:30 mins    |
| Drawio Implementation     | ~1:00 hrs     |
| **Initial Backend Total** | **~3:30 hrs** |

## 📝 Conclusion

This event-driven architecture provides a robust, scalable, and reliable solution for asynchronous membership exports. By decoupling services and focusing on modern cloud patterns, the system meets current requirements while remaining flexible for future enhancements and delivering an excellent user experience.
