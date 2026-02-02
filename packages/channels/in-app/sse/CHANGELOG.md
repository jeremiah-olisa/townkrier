# Changelog

## [1.0.0-alpha.1] - 2026-02-02

### Added

- Initial release of Server-Sent Events (SSE) adapter
- Real-time notification delivery via SSE
- Connection management for multiple users
- Heartbeat/keep-alive mechanism
- Support for multiple connections per user
- Automatic cleanup of disconnected clients
- Custom event types support
- Complete TypeScript type definitions
- Comprehensive README with Express and NestJS examples
- Client-side implementation examples

### Features

- ✅ Real-time push to connected clients
- ✅ Automatic connection tracking
- ✅ Configurable heartbeat interval
- ✅ Connection limits per user
- ✅ Graceful connection cleanup
- ✅ Works with Express, NestJS, and other Node.js frameworks
- ✅ EventSource API compatible

### Configuration Options

- heartbeatInterval: Interval for keep-alive comments (default: 30000ms)
- maxConnections: Maximum concurrent connections per user (default: 10)
- eventType: Custom event type name (default: 'notification')

### Dependencies

- townkrier-core: workspace:\*
