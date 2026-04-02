## ADDED Requirements

### Requirement: Custom keyboard shortcut binding
The system SHALL allow users to bind a keyboard shortcut (single key or modifier+key combination) to a command string that will be sent to the active SSH terminal.

### Requirement: Supported modifier keys - Windows
The system SHALL support modifier keys Ctrl, Alt, and Shift in combination with other keys on Windows.

### Requirement: Supported modifier keys - macOS
The system SHALL support modifier keys Cmd, Opt, and Shift in combination with other keys on macOS.

### Requirement: Scope: global vs per-tab
The system SHALL allow users to specify whether a shortcut is global (works when app is focused regardless of active tab) or tab-scoped (only works when its associated tab is active).

### Requirement: Conflict detection
The system SHALL detect when a user attempts to bind a shortcut that is already in use by the system or another custom shortcut and display a warning before saving.

### Requirement: Conflict resolution
The system SHALL allow user to override a conflicting shortcut or choose a different key combination.

### Requirement: Import shortcuts configuration
The system SHALL allow importing shortcut definitions from a JSON file.

### Requirement: Export shortcuts configuration
The system SHALL allow exporting all shortcut definitions to a JSON file.

### Requirement: Shortcuts persistence
The system SHALL persist all shortcut definitions to local storage, surviving application restarts.

### Requirement: Execute shortcut sends command
When user presses a bound shortcut, the system SHALL send the associated command string (with newline appended) to the active SSH terminal session.

#### Scenario: Create new shortcut - Windows
- **WHEN** user opens shortcut settings, selects "New Shortcut", presses Ctrl+K, types command "kubectl get pods"
- **THEN** shortcut "Ctrl+K" is saved and associated with command "kubectl get pods"

#### Scenario: Create new shortcut - macOS
- **WHEN** user opens shortcut settings, selects "New Shortcut", presses Cmd+K, types command "kubectl get pods"
- **THEN** shortcut "Cmd+K" is saved and associated with command "kubectl get pods"

#### Scenario: Global scope shortcut
- **WHEN** user creates shortcut Ctrl+Shift+L with command "clear" and sets scope to "global"
- **AND** user is on tab "Server B"
- **AND** presses Ctrl+Shift+L
- **THEN** "clear\n" is sent to tab "Server B"

#### Scenario: Tab-scoped shortcut
- **WHEN** user creates shortcut Ctrl+1 with command "htop" and sets scope to "tab: Server A"
- **AND** user is on tab "Server B"
- **AND** presses Ctrl+1
- **THEN** nothing is sent (shortcut not active for this tab)

#### Scenario: Conflict detection on duplicate
- **WHEN** user attempts to bind Ctrl+C to a custom command
- **THEN** system warns that Ctrl+C is a reserved shortcut for copy/SIGINT
- **AND** does not allow binding without explicit override

#### Scenario: Override conflicting shortcut
- **WHEN** user attempts to bind a shortcut that conflicts with an existing custom shortcut
- **AND** user confirms override
- **THEN** new shortcut replaces the old one

#### Scenario: Import shortcuts from JSON
- **WHEN** user clicks "Import" and selects "shortcuts.json"
- **THEN** all shortcut definitions from the file are loaded
- **AND** existing shortcuts are replaced or merged per import mode

#### Scenario: Export shortcuts to JSON
- **WHEN** user clicks "Export"
- **THEN** system saves a JSON file containing all shortcut definitions

#### Scenario: Press shortcut sends command to active terminal
- **WHEN** shortcut "Ctrl+K" -> "kubectl get pods" exists
- **AND** user presses Ctrl+K while tab "Server A" is active
- **THEN** "kubectl get pods\n" is sent to the SSH session in tab "Server A"
