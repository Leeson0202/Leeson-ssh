## ADDED Requirements

### Requirement: SSH connection establishment
The system SHALL establish an SSH connection using the SSH2 protocol to a remote server specified by host, port, and username.

### Requirement: Password authentication
The system SHALL authenticate users via password login, where the user provides a plaintext password that is transmitted securely to the remote server.

### Requirement: Private key authentication
The system SHALL authenticate users via private key login, supporting .pem, id_rsa, and other standard OpenSSH private key formats.

### Requirement: Connection state management
The system SHALL track and expose connection states: disconnected, connecting, connected, reconnecting, connection_failed, timeout, authentication_failed, and network_error.

### Requirement: Connection timeout handling
The system SHALL trigger a connection timeout error when the SSH handshake is not completed within a configurable time period (default 30 seconds).

### Requirement: Authentication failure handling
The system SHALL return an authentication failure error when credentials are rejected by the remote server.

### Requirement: Network error handling
The system SHALL return a network error when the TCP connection cannot be established or is lost unexpectedly.

### Requirement: Quick connect without bookmark
The system SHALL allow users to directly input connection parameters (host, port, username, auth type, credentials) without saving to a bookmark and initiate immediate connection.

### Requirement: Session lifecycle management
The system SHALL support creating multiple independent SSH sessions, each mapped to a unique session ID, supporting up to 20 concurrent sessions.

### Requirement: Data forwarding between session and terminal
The system SHALL forward SSH server output to the terminal renderer and forward user keyboard input from the terminal renderer to the SSH session.

### Requirement: Automatic reconnection
The system SHALL automatically attempt to reconnect when an established SSH connection is lost unexpectedly, using exponential backoff starting at 1 second, doubling on each retry (2s, 4s, 8s, 16s, 32s), with a maximum delay of 60 seconds.

### Requirement: Reconnection status notification
The system SHALL notify the renderer when a reconnection attempt is in progress, including the attempt count and next retry delay.

### Requirement: Reconnection success recovery
The system SHALL restore terminal content and resume normal operation when a reconnection attempt succeeds.

#### Scenario: Successful password connection
- **WHEN** user provides host "192.168.1.100", port 22, username "admin", and password "secret123"
- **THEN** system establishes SSH connection and transitions to "connected" state
- **AND** terminal displays server welcome message or shell prompt

#### Scenario: Successful private key connection
- **WHEN** user provides host "example.com", port 22, username "deploy", and selects private key authentication with file "/path/to/id_rsa"
- **THEN** system loads private key, establishes SSH connection, and transitions to "connected" state

#### Scenario: Connection timeout
- **WHEN** user initiates connection to an unreachable host and exceeds the timeout period
- **THEN** system transitions to "timeout" state and displays timeout error message to user

#### Scenario: Authentication failure
- **WHEN** user provides incorrect password or invalid private key
- **THEN** system transitions to "authentication_failed" state and displays authentication error

#### Scenario: Quick connect flow
- **WHEN** user fills in temporary connection form without saving bookmark and clicks "Connect"
- **THEN** system creates a new terminal tab, initiates SSH connection, and displays connection status in tab title

#### Scenario: Multiple concurrent sessions
- **WHEN** user has 10 active SSH sessions and initiates 10 more connections
- **THEN** all 20 sessions are established successfully with unique session IDs
- **AND** each session operates independently

#### Scenario: Automatic reconnection on unexpected disconnect
- **WHEN** SSH connection is established and active
- **AND** the connection is unexpectedly terminated (network issue, server crash)
- **THEN** system transitions to "reconnecting" state
- **AND** displays reconnection status in tab indicator
- **AND** attempts to reconnect after 1 second

#### Scenario: Exponential backoff reconnection
- **WHEN** SSH connection fails to reconnect on first attempt
- **THEN** system retries after 2 seconds
- **AND** if that fails, retries after 4 seconds
- **AND** continues doubling delay up to maximum 60 seconds

#### Scenario: Reconnection success
- **WHEN** system is attempting to reconnect after connection loss
- **AND** connection is successfully re-established
- **THEN** system transitions to "connected" state
- **AND** restores terminal scrollback content
- **AND** resumes normal input/output operation
