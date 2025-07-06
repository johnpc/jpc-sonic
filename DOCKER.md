# Docker Deployment Guide

This guide explains how to deploy the Amazon Nova Sonic TypeScript application using Docker.

## Overview

The Docker setup runs two services simultaneously:
- **Static Frontend Server** on port 8080 (serves the web interface)
- **WebSocket Backend Server** on port 3000 (handles Nova Sonic integration)

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and start the application:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:8080
   - WebSocket API: http://localhost:3000

3. **Stop the application:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t nova-sonic-app .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 -p 8080:8080 \
     -v ~/.aws:/root/.aws:ro \
     -e AWS_PROFILE_NAME=your-profile \
     nova-sonic-app
   ```

## Configuration

### AWS Credentials

#### Method 1: AWS Profile (Recommended)
```bash
# Using docker-compose
docker-compose up --build

# Using docker run
docker run -p 3000:3000 -p 8080:8080 \
  -v ~/.aws:/root/.aws:ro \
  -e AWS_PROFILE_NAME=your-profile-name \
  nova-sonic-app
```

#### Method 2: Environment Variables
```bash
# Using docker-compose
AWS_ACCESS_KEY_ID=your_key \
AWS_SECRET_ACCESS_KEY=your_secret \
docker-compose up --build

# Using docker run
docker run -p 3000:3000 -p 8080:8080 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_SESSION_TOKEN=your_token \
  nova-sonic-app
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | WebSocket server port | 3000 |
| `STATIC_PORT` | Static file server port | 8080 |
| `NODE_ENV` | Node environment | production |
| `AWS_PROFILE_NAME` | AWS profile to use | - |
| `AWS_ACCESS_KEY_ID` | AWS access key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `AWS_SESSION_TOKEN` | AWS session token | - |
| `AWS_REGION` | AWS region | us-east-1 |
| `SYSTEM_PROMPT` | Custom AI system prompt | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost:8080 |

### Custom System Prompt

```bash
# Set custom system prompt
docker run -p 3000:3000 -p 8080:8080 \
  -e SYSTEM_PROMPT="You are a helpful coding assistant" \
  nova-sonic-app
```

## Development Mode

For development with hot reload:

```bash
# Start development container
docker-compose --profile dev up nova-sonic-dev

# Access development instance
# Frontend: http://localhost:8081
# WebSocket API: http://localhost:3001
```

## Health Checks

The container includes health checks for both services:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' <container_id>
```

## Troubleshooting

### Container Won't Start

1. **Check logs:**
   ```bash
   docker-compose logs nova-sonic-app
   ```

2. **Verify AWS credentials:**
   ```bash
   # Test authentication inside container
   docker-compose exec nova-sonic-app npm run test-auth
   ```

### Port Conflicts

If ports 3000 or 8080 are already in use:

```bash
# Use different ports
docker run -p 3001:3000 -p 8081:8080 nova-sonic-app
```

### Permission Issues

If you encounter permission issues with AWS credentials:

```bash
# Fix AWS credentials permissions
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config
```

### Build Issues

1. **Clear Docker cache:**
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

2. **Check Docker resources:**
   ```bash
   docker system df
   ```

## Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml nova-sonic
```

### Using Kubernetes

Create a Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nova-sonic-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nova-sonic-app
  template:
    metadata:
      labels:
        app: nova-sonic-app
    spec:
      containers:
      - name: nova-sonic-app
        image: nova-sonic-app:latest
        ports:
        - containerPort: 3000
        - containerPort: 8080
        env:
        - name: AWS_REGION
          value: "us-east-1"
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: nova-sonic-service
spec:
  selector:
    app: nova-sonic-app
  ports:
  - name: websocket
    port: 3000
    targetPort: 3000
  - name: frontend
    port: 8080
    targetPort: 8080
  type: LoadBalancer
```

### Security Considerations

1. **Use non-root user** (already configured in Dockerfile)
2. **Limit container resources:**
   ```bash
   docker run --memory=512m --cpus=1.0 nova-sonic-app
   ```
3. **Use secrets for AWS credentials in production**
4. **Enable TLS/SSL for production deployments**

## Monitoring

### Container Metrics

```bash
# View container stats
docker stats

# View logs
docker-compose logs -f nova-sonic-app
```

### Application Metrics

The application exposes health endpoints:
- Frontend health: http://localhost:8080/
- WebSocket health: http://localhost:3000/socket.io/

## Scaling

### Horizontal Scaling

```bash
# Scale with docker-compose
docker-compose up --scale nova-sonic-app=3

# Scale with Docker Swarm
docker service scale nova-sonic_nova-sonic-app=3
```

### Load Balancing

For multiple instances, use a load balancer like nginx:

```nginx
upstream nova_sonic_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

upstream nova_sonic_frontend {
    server localhost:8080;
    server localhost:8081;
    server localhost:8082;
}

server {
    listen 80;
    
    location /socket.io/ {
        proxy_pass http://nova_sonic_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location / {
        proxy_pass http://nova_sonic_frontend;
    }
}
```
