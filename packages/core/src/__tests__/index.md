# Core test index

This index summarizes test coverage for the core package. Use it to verify coverage and identify gaps.

## Adapter fallback

Source: [packages/core/src/**tests**/adapter-fallback.test.ts](packages/core/src/__tests__/adapter-fallback.test.ts)

- Multiple adapters supported for one channel.
- Adapter priority order is respected.
- Falls back to second adapter when first fails.
- Falls back through all adapters in order.
- Throws when all adapters fail.
- Skips disabled adapters.
- Legacy single-adapter config still works.
- Mixed legacy + new adapter config works.
- `sendWithAdapterFallback()` can be used directly.

## Notification manager

Source: [packages/core/src/**tests**/notification-manager.test.ts](packages/core/src/__tests__/notification-manager.test.ts)

- Creates manager with and without config.
- Registers factory and initializes from config.
- Does not initialize disabled channels.
- Registers channel instance directly.
- `getChannel()` returns channel, errors on missing or not ready, is case-insensitive.
- `hasChannel()` returns true/false correctly.
- `getAvailableChannels()` returns all channels or empty when none.
- `getReadyChannels()` returns only ready channels.
- `setDefaultChannel()` sets default or throws on missing.
- `send()` succeeds with configured channel.
- `send()` throws when no channels are configured.
- `removeChannel()` removes a channel.
- `clear()` removes all channels.

## Notifiable + notify helper

Source: [packages/core/src/**tests**/notify.test.ts](packages/core/src/__tests__/notify.test.ts)

- Converts `Notifiable` to `NotificationRecipient` and calls `manager.send()`.
- Excludes channels without routing info.
- Returns result from `manager.send()`.
- Handles null routing info.
- Handles undefined routing info.
- Propagates errors from `manager.send()`.
- Supports complex routing info (arrays and objects).
