# Enhanced Notifiable Class - Implementation Summary

## Overview

The `Notifiable` abstract class has been significantly enhanced to provide a rich set of features for entities (like User, Admin, Customer) that can receive notifications through various channels.

## Key Features Implemented

### 1. **Dependency Injection Support**

- Optional `NotificationManager` can be injected via constructor
- Allows calling `notify(notification)` without passing manager explicitly
- Manager can be set/updated after construction using `setNotificationManager()`

### 2. **Method Overloading for notify()**

Two ways to send notifications:

```typescript
// With injected manager
const user = new User('123', 'user@example.com', 'John', manager);
await user.notify(new WelcomeNotification()); // Uses injected manager

// With explicit manager
const user2 = new User('456', 'user2@example.com', 'Jane');
await user2.notify(new WelcomeNotification(), manager); // Pass manager explicitly
```

### 3. **Helper Methods**

#### Channel Validation

- `hasChannelRoute(channel)` - Check if routing info exists for a channel
- `canReceiveVia(channel)` - Alias for hasChannelRoute
- `hasAllChannels(channels[])` - Check if ALL channels have routing info
- `hasAnyChannel(channels[])` - Check if ANY channel has routing info
- `getAvailableChannels()` - Get list of all available channels

#### Utility Methods

- `toRecipient(channels?)` - Convert Notifiable to NotificationRecipient object
- `getIdentifier()` - Get user-friendly identifier
- `getNotificationManager()` - Get current manager instance

## Usage Examples

### Basic Usage - Injected Manager

```typescript
class User extends Notifiable {
  constructor(
    public id: string,
    public email: string,
    public phone?: string,
    public name?: string,
    manager?: NotificationManager,
  ) {
    super(manager);
  }

  routeNotificationFor(channel: NotificationChannel): string | undefined {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.email;
      case NotificationChannel.SMS:
        return this.phone;
      default:
        return this.email;
    }
  }

  getNotificationName(): string {
    return this.name || 'User';
  }
}

// Usage
const user = new User('123', 'user@example.com', '+1234567890', 'John', manager);
await user.notify(new WelcomeNotification());
```

### Conditional Sending Based on Channel Availability

```typescript
const user = new User('456', 'user@example.com', '+1234567890', 'Jane');

// Check if user can receive SMS
if (user.canReceiveVia(NotificationChannel.SMS)) {
  await user.notify(new SmsNotification(), manager);
}

// Check if user has all required channels
if (user.hasAllChannels([NotificationChannel.EMAIL, NotificationChannel.SMS])) {
  await user.notify(new MultiChannelNotification(), manager);
}

// Check available channels
const channels = user.getAvailableChannels();
console.log('User can receive via:', channels);
// Output: [NotificationChannel.EMAIL, NotificationChannel.SMS]
```

### Setting Manager After Construction

```typescript
const user = new User('789', 'bob@example.com');
user.setNotificationManager(manager);
await user.notify(new Notification());
```

### Converting to Recipient Object

```typescript
const user = new User('999', 'alice@example.com', '+1234567890');

// Get recipient object for specific channels
const recipient = user.toRecipient([NotificationChannel.EMAIL, NotificationChannel.SMS]);
// { email: 'alice@example.com', sms: '+1234567890' }

// Use with queue
await queueManager.enqueue(notification, recipient, config);
```

## Benefits

### 1. **Cleaner Code**

- No need to manually build `NotificationRecipient` objects
- No need to pass manager around everywhere
- Chainable methods for better readability

### 2. **Type Safety**

- All methods properly typed
- Compile-time checking for channel availability

### 3. **Flexibility**

- Works with or without injected manager
- Manager can be overridden per call
- Compatible with dependency injection frameworks

### 4. **Better Developer Experience**

- Intuitive method names
- Comprehensive documentation
- Clear error messages

### 5. **Framework Integration**

- Perfect for NestJS with dependency injection
- Works well with Express.js services
- Compatible with any TypeScript framework

## Framework Integration Examples

### NestJS Integration

```typescript
@Injectable()
class User extends Notifiable {
  constructor(
    public id: string,
    public email: string,
    @Inject(NotificationManager) manager: NotificationManager,
  ) {
    super(manager);
  }

  routeNotificationFor(channel: NotificationChannel) {
    return channel === NotificationChannel.EMAIL ? this.email : undefined;
  }
}

// In your service
@Injectable()
class UserService {
  constructor(private notificationManager: NotificationManager) {}

  async createUser(email: string) {
    const user = new User('id', email, this.notificationManager);
    await user.notify(new WelcomeNotification());
    return user;
  }
}
```

### Repository Pattern

```typescript
class UserRepository {
  constructor(private manager: NotificationManager) {}

  async findById(id: string): Promise<User> {
    const userData = await db.users.findOne(id);
    return new User(
      userData.id,
      userData.email,
      userData.phone,
      userData.name,
      this.manager, // Inject manager when loading from database
    );
  }
}
```

## Error Handling

The enhanced class includes clear error messages:

```typescript
const user = new User('123', 'user@example.com'); // No manager injected

try {
  await user.notify(new Notification());
} catch (error) {
  console.error(error.message);
  // "No notification manager available. Either pass a manager explicitly
  // or inject one via constructor/setNotificationManager()"
}
```

## Testing

The enhanced class makes testing easier:

```typescript
describe('User notifications', () => {
  it('should send notification using injected manager', async () => {
    const mockManager = createMockManager();
    const user = new User('123', 'test@example.com', '+1234567890', 'Test', mockManager);

    await user.notify(new TestNotification());

    expect(mockManager.send).toHaveBeenCalled();
  });

  it('should throw error when no manager available', async () => {
    const user = new User('123', 'test@example.com');

    await expect(user.notify(new TestNotification())).rejects.toThrow(
      'No notification manager available',
    );
  });
});
```

## Migration Guide

### From Old Interface to New Abstract Class

**Before:**

```typescript
class User implements Notifiable {
  routeNotificationFor(channel: NotificationChannel) {
    return this.email;
  }
}

// Had to use notify helper function
await notify(user, notification, manager);
```

**After:**

```typescript
class User extends Notifiable {
  constructor(email: string, manager?: NotificationManager) {
    super(manager);
    this.email = email;
  }

  routeNotificationFor(channel: NotificationChannel) {
    return this.email;
  }
}

// Can use instance method
await user.notify(notification);
// Or still use helper if preferred
await notify(user, notification, manager);
```

## Files Modified

1. **`packages/core/src/core/notifiable/index.ts`** - Enhanced abstract class
2. **`packages/core/src/core/notifiable/utils.ts`** - Helper function (unchanged)
3. **`examples/console/notifiable-class-example.ts`** - Comprehensive example
4. **`packages/core/src/__tests__/notify.test.ts`** - Tests for notify function

## API Reference

### Constructor

```typescript
constructor(manager?: NotificationManager)
```

### Abstract Methods

```typescript
abstract routeNotificationFor(channel: NotificationChannel): string | string[] | unknown;
abstract getNotificationName?(): string;
```

### Instance Methods

#### notify

```typescript
notify(notification: Notification): Promise<Map<NotificationChannel, unknown>>;
notify(notification: Notification, manager: NotificationManager): Promise<Map<NotificationChannel, unknown>>;
```

#### setNotificationManager

```typescript
setNotificationManager(manager: NotificationManager): this
```

#### getNotificationManager

```typescript
getNotificationManager(): NotificationManager | undefined
```

#### hasChannelRoute

```typescript
hasChannelRoute(channel: NotificationChannel): boolean
```

#### canReceiveVia

```typescript
canReceiveVia(channel: NotificationChannel): boolean
```

#### hasAllChannels

```typescript
hasAllChannels(channels: NotificationChannel[]): boolean
```

#### hasAnyChannel

```typescript
hasAnyChannel(channels: NotificationChannel[]): boolean
```

#### getAvailableChannels

```typescript
getAvailableChannels(): NotificationChannel[]
```

#### toRecipient

```typescript
toRecipient(channels?: NotificationChannel[], notification?: Notification): NotificationRecipient
```

#### getIdentifier

```typescript
getIdentifier(): string
```

## Conclusion

The enhanced `Notifiable` class provides a powerful, type-safe, and developer-friendly way to work with notification-capable entities. It supports modern patterns like dependency injection while maintaining backward compatibility with the helper function approach.
