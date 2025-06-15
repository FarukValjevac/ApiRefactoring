# Task 2: Membership Export Architecture

## 📋 Table of Contents

- [Goal](#-goal)
- [Architecture Overview](#EF%B8%8F-architecture-overview)
- [Key Components](#-key-components)
- [Process Flow](#-process-flow)
- [Architectural Decisions](#-architectural-decisions)
- [Scalability Strategies](#-scalability-strategies)
- [Reliability & Error Handling](#EF%B8%8F-reliability--error-handling)
- [Key Assumptions](#-key-assumptions)
- [Security Considerations](#-security-considerations)
- [Cost Optimization](#-cost-optimization)
- [Time Estimation](#%EF%B8%8F-time-estimation)
- [Conclusion](#-conclusion)

## 🎯 Goal

Design a stable and scalable asynchronous architecture for exporting user membership data to CSV files and delivering them via email. The system must handle time-intensive export operations (several seconds) without blocking the API, ensuring optimal user experience and system reliability.

## 🏗️ Architecture Overview

The solution implements an event-driven, microservices architecture that leverages message queues for asynchronous processing and event streaming for service communication. This design ensures high availability, fault tolerance, and horizontal scalability.

## 📋 Key Components

### 1. **API Layer with Rate Limiting**

- **Technology**: API Gateway or NestJS Throttler
- **Purpose**:
  - Enforces rate limits (1 export per user per hour)
  - Validates authentication and authorization
  - Returns immediate response to prevent timeouts
- **Response**: 202 Accepted with job ID for status tracking

### 2. **Message Queue (BullMQ)**

- **Purpose**: Asynchronous job processing
- **Key Features**:
  - Decouples API from processing layer
  - Built-in retry logic with exponential backoff
  - Job prioritization and concurrency control
  - Handles traffic bursts gracefully
- **Benefits**:
  - Prevents API timeouts
  - Enables job tracking and monitoring
  - Supports horizontal scaling of workers

### 3. **Memberships Export Service**

- **Components**:
  - **Export Processor**: Orchestrates the entire export workflow
  - **Concurrency Control**: Prevents resource exhaustion
  - **Auto-scaling**: Dynamically adjusts workers based on queue depth
- **Workflow**:
  1. Polls jobs from BullMQ
  2. Executes optimized database queries
  3. Generates CSV files
  4. Uploads to S3 storage
  5. Publishes completion event to Kafka

### 4. **Data Storage Infrastructure**

#### **Read Replica Database**

- **Purpose**: Isolates export queries from production traffic
- **Optimizations**:
  - Indexed on user_id for query performance
  - Connection pooling for efficiency
  - Query optimization for large datasets

#### **S3 Object Storage**

- **Purpose**: Durable, scalable file storage
- **Features**:
  - Server-side encryption for security
  - Lifecycle policies (30-day retention)
  - High availability across regions
  - Cost-effective for large files

### 5. **Event Streaming (Kafka)**

- **Purpose**: Decoupled service communication
- **Topic**: Email Request Queue
- **Benefits**:
  - Event-driven architecture
  - Enables multiple consumers (future: SMS, webhooks)
  - Message durability and replay capability
  - High-throughput event processing

### 6. **Email Service**

- **Components**:
  - **Email Request Processor**: Kafka consumer
  - **S3 Integration**: Generates pre-signed URLs
  - **Email Provider**: SendGrid/SES/Mailgun
- **Features**:
  - Template-based email generation
  - Pre-signed URL generation (7-day expiry)
  - Delivery tracking and retry logic
  - Provider abstraction for flexibility

## 📊 Process Flow

1. **Export Request**

   - User requests export via API endpoint
   - API validates authentication and rate limits
   - Request queued in BullMQ
   - Returns 202 Accepted with job ID

2. **Asynchronous Processing**

   - Export worker picks up job from queue
   - Queries read replica for user membership data
   - Generates CSV with proper formatting
   - Uploads encrypted file to S3

3. **Event Publishing**

   - Export service publishes "ExportCompleted" event to Kafka
   - Event contains: userId, s3Key, metadata

4. **Email Notification**
   - Email service consumes event from Kafka
   - Generates pre-signed S3 URL (7-day expiry)
   - Sends formatted email with download link
   - Handles delivery failures with retry logic

## 🔧 Architectural Decisions

### 1. **Asynchronous Processing via BullMQ**

- **Rationale**: Export operations can take several seconds
- **Benefits**:
  - Immediate API response (better UX)
  - Retry capability for transient failures
  - Job visibility and monitoring
  - Prevents request timeouts

### 2. **S3 Storage with Pre-signed URLs**

- **Rationale**: Email attachments have size limitations
- **Benefits**:
  - No file size constraints
  - Secure, time-limited access
  - Cost-effective storage
  - Direct download performance

### 3. **Kafka for Service Communication**

- **Rationale**: True event-driven architecture
- **Benefits**:
  - Service decoupling
  - Event durability
  - Multiple consumer support
  - Future extensibility

### 4. **Read Replica for Exports**

- **Rationale**: Export queries are resource-intensive
- **Benefits**:
  - Isolates analytical queries
  - Protects production performance
  - Enables query optimization

### 5. **Separate Email Service**

- **Rationale**: Single responsibility principle
- **Benefits**:
  - Independent scaling
  - Provider flexibility
  - Failure isolation
  - Easier testing

## 🚀 Scalability Strategies

1. **Horizontal Scaling**

   - Export workers auto-scale based on queue depth
   - Email service scales based on Kafka lag
   - API instances behind load balancer

2. **Performance Optimizations**

   - Database query optimization with indexes
   - CSV streaming for large datasets
   - S3 multipart uploads for large files
   - Connection pooling

3. **Resource Management**
   - Concurrency limits prevent overload
   - Circuit breakers for external services
   - Graceful shutdown handling

## 🛡️ Reliability & Error Handling

### Error Handling Strategy

1. **Export Processing Failures**

   - 3 retries with exponential backoff
   - Dead Letter Queue for investigation
   - User notification on permanent failure

2. **Email Delivery Failures**

   - Retry logic in email service
   - Fallback providers
   - Delivery status tracking

3. **S3 Upload Failures**
   - Immediate retry with different region
   - Temporary local storage as fallback

### Monitoring & Alerts

- Queue depth and processing times
- Success/failure rates
- Service health metrics
- Business KPIs (exports per hour)

## 📏 Key Assumptions

1. **Data Volume**

   - Average export: 10K-100K records
   - Maximum export: 1M records
   - File size: 1MB-100MB

2. **Performance Requirements**

   - Export completion: 30 seconds - 5 minutes
   - Email delivery: Within 5 minutes
   - System availability: 99.9% uptime

3. **Usage Patterns**

   - Monthly export frequency per user
   - Peak usage during business hours
   - 1000+ concurrent exports supported

4. **Retention Policy**
   - S3 files: 30-day lifecycle
   - Pre-signed URLs: 7-day expiry
   - Job history: 90 days

## 🔒 Security Considerations

1. **Authentication & Authorization**

   - JWT/OAuth validation at API Gateway
   - Users can only export their own data
   - Role-based access control

2. **Data Protection**

   - Encryption at rest (S3)
   - Encryption in transit (TLS)
   - Pre-signed URLs for secure access
   - No permanent public links

3. **Compliance**
   - GDPR-compliant data handling
   - Audit logging for all exports
   - PII data protection

## 💰 Cost Optimization

1. **Compute**

   - Spot instances for export workers
   - Auto-scaling to match demand
   - Efficient resource utilization

2. **Storage**

   - S3 lifecycle policies
   - Intelligent tiering
   - Compression for large files

3. **Data Transfer**
   - CloudFront for frequent downloads
   - Regional S3 buckets
   - Efficient query patterns

### ⏱️ Time Estimation

| Phase                     | Time          |
| :------------------------ | :------------ |
| Planning                  | ~1:30 mins    |
| Drawio Implementation     | ~1:00 hrs     |
| **Initial Backend Total** | **~2:30 hrs** |

## 📝 Conclusion

This architecture provides a robust, scalable solution for asynchronous membership exports. By leveraging modern cloud patterns and event-driven design, the system can handle current requirements while remaining flexible for future enhancements. The separation of concerns, proper use of messaging patterns, and focus on reliability ensure a production-ready solution that delivers excellent user experience.
