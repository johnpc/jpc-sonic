# JPC Sonic App

A real-time voice conversation application powered by Amazon Nova Sonic, enabling natural spoken dialog with AI through bidirectional audio streaming.

## Overview

JPC Sonic App provides both web-based and command-line interfaces for interacting with Amazon Nova Sonic's bidirectional streaming capabilities. The application supports real-time voice conversations with configurable AI personalities and robust audio processing.

### Key Features

- **Real-time Voice Conversations**: Bidirectional audio streaming with Amazon Nova Sonic
- **Web Interface**: Browser-based voice chat with intuitive controls
- **CLI Interface**: Command-line tool for batch audio processing
- **Flexible Authentication**: Support for AWS profiles and environment variables
- **Docker Support**: Containerized deployment with Docker Compose
- **Configurable AI Personality**: Customizable system prompts
- **Cross-platform**: Works on macOS, Linux, and Windows

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Express       │    │   Amazon Nova   │
│   (Browser)     │◄──►│   Server        │◄──►│   Sonic         │
│                 │    │   (WebSocket)   │    │   (Bedrock)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │   CLI Client    │
                       │   (Node.js)     │
                       └─────────────────┘
```

## Prerequisites

- **Node.js** 18+ and npm/pnpm
- **AWS Account** with Bedrock access
- **Amazon Nova Sonic** model access in your AWS region
- **TypeScript** (installed via dependencies)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd jpc-sonic-app
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# AWS Authentication (choose one method)
# Method 1: AWS Profile
AWS_PROFILE_NAME=default

# Method 2: Direct credentials
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_SESSION_TOKEN=your_session_token  # Optional

# Server Configuration
PORT=3000
AWS_REGION=us-east-1

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# AI Personality
SYSTEM_PROMPT=You are a helpful AI assistant. Keep responses conversational and concise.

# Static Build Configuration
WEBSOCKET_SERVER_URL=http://localhost:3000
```

## Usage

### Web Interface

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Start a conversation:**
   - Click "Start Streaming" to begin voice input
   - Speak naturally - the AI will respond with voice
   - Click "Stop Streaming" to end the session

### Command Line Interface

Process audio files directly:

```bash
npm run cli
```

The CLI will:
- Process the audio file in `./input-audio-example/japan16k.raw`
- Generate conversation transcripts
- Save audio responses to `./output/` directory

### Production Deployment

#### Using Docker Compose (Recommended)

```bash
# Build and start services
docker-compose up --build

# Access the application
# Frontend: http://localhost:8080
# WebSocket API: http://localhost:3000

# Stop services
docker-compose down
```

#### Manual Build

```bash
# Build TypeScript
npm run build

# Build static assets
npm run build-static

# Start production server
npm start
```

## API Reference

### WebSocket Events

The application uses Socket.IO for real-time communication:

#### Client → Server Events

- **`start-streaming`**: Initialize audio streaming session
- **`audio-chunk`**: Send audio data (Buffer)
- **`stop-streaming`**: End streaming session

#### Server → Client Events

- **`audio-response`**: Receive AI audio response (Buffer)
- **`transcript`**: Receive conversation transcript
- **`error`**: Error notifications
- **`streaming-started`**: Confirmation of session start
- **`streaming-stopped`**: Confirmation of session end

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_PROFILE_NAME` | AWS profile for authentication | `default` |
| `AWS_ACCESS_KEY_ID` | Direct AWS access key | - |
| `AWS_SECRET_ACCESS_KEY` | Direct AWS secret key | - |
| `AWS_SESSION_TOKEN` | AWS session token (optional) | - |
| `AWS_REGION` | AWS region for Bedrock | `us-east-1` |
| `PORT` | Server port | `3000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,http://localhost:8080` |
| `SYSTEM_PROMPT` | AI personality prompt | Default conversational prompt |
| `WEBSOCKET_SERVER_URL` | WebSocket server URL for static builds | `http://localhost:3000` |

## Development

### Project Structure

```
jpc-sonic-app/
├── src/
│   ├── server.ts          # Express server with WebSocket
│   ├── index-cli.ts       # CLI interface
│   ├── client.ts          # Nova Sonic client wrapper
│   ├── types.ts           # TypeScript type definitions
│   └── consts.ts          # Application constants
├── public/
│   ├── index.html         # Web interface
│   ├── src/
│   │   ├── main.js        # Frontend JavaScript
│   │   └── style.css      # Styling
│   └── prompts/           # System prompt examples
├── input-audio-example/   # Sample audio files
├── output/                # CLI output directory
├── dist/                  # Compiled TypeScript
├── dist-static/           # Static build output
└── scripts/               # Build and deployment scripts
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run cli` | Run CLI interface |
| `npm run build-static` | Build static assets for deployment |
| `npm run test-auth` | Test AWS authentication |

### Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Test locally** with `npm run dev`
3. **Build for production** with `npm run build`
4. **Test production build** with `npm start`
5. **Deploy** using Docker or static build

## Troubleshooting

### Common Issues

#### Authentication Errors

```bash
# Test AWS credentials
npm run test-auth
```

**Solutions:**
- Verify AWS credentials in `.env` or AWS profile
- Ensure Bedrock access in your AWS account
- Check AWS region configuration

#### Audio Issues

**Microphone not working:**
- Grant microphone permissions in browser
- Check browser compatibility (Chrome/Firefox recommended)
- Verify HTTPS in production (required for microphone access)

**No audio response:**
- Check browser console for errors
- Verify WebSocket connection
- Ensure Nova Sonic model access in AWS

#### Connection Issues

**WebSocket connection failed:**
- Verify server is running on correct port
- Check CORS configuration in `.env`
- Ensure firewall allows connections

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
DEBUG=* npm run dev
```

### Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 80+ | ✅ Full | Recommended |
| Firefox 75+ | ✅ Full | Recommended |
| Safari 14+ | ⚠️ Limited | Some audio issues |
| Edge 80+ | ✅ Full | Chromium-based |

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Test changes with both web and CLI interfaces

## Security

### Best Practices

- **Never commit AWS credentials** to version control
- **Use environment variables** for sensitive configuration
- **Enable CORS** only for trusted origins
- **Use HTTPS** in production for microphone access
- **Regularly rotate** AWS access keys

### Reporting Security Issues

Please report security vulnerabilities privately to the maintainers.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Amazon Nova Sonic** for bidirectional streaming capabilities
- **AWS Bedrock** for AI model hosting
- **Socket.IO** for real-time communication
- **Express.js** for web server framework

## Support

For support and questions:

1. **Check the troubleshooting section** above
2. **Review existing issues** in the repository
3. **Create a new issue** with detailed information
4. **Include logs and error messages** when reporting bugs

---

**Built with ❤️ using Amazon Nova Sonic and TypeScript**
