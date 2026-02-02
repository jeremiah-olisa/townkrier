# Changelog

## [1.0.0-alpha.1] - 2026-02-02

### Added

- Initial release of Expo Push Notifications adapter
- Support for sending push notifications to Expo-enabled React Native apps
- Automatic push token validation
- Batch sending with automatic chunking (max 100 per request)
- Support for custom data payloads
- Priority mapping (low, normal, high, urgent)
- Sound, badge, and title/body configuration
- Receipt checking capability
- Complete TypeScript type definitions
- Comprehensive README with usage examples

### Features

- ✅ Send to single or multiple devices
- ✅ Validate Expo push tokens
- ✅ Automatic chunking for batch operations
- ✅ Error handling and detailed responses
- ✅ Support for platform-specific options (iOS/Android)

### Dependencies

- expo-server-sdk: ^3.10.0
- townkrier-core: workspace:\*
