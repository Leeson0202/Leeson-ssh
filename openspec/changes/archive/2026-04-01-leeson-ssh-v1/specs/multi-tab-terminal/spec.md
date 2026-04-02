## ADDED Requirements

### Requirement: Multiple terminal tabs
The system SHALL support opening multiple terminal tabs simultaneously, each containing an independent SSH session.

### Requirement: Tab title customization
The system SHALL allow users to rename tab titles by double-clicking the tab title area.

### Requirement: Default session naming
The system SHALL use the SSH server host:port as the default tab title when no custom name is provided by the user.

### Requirement: Connection status indicator in tab
The system SHALL display a visual indicator in the tab showing connection state: a colored dot (green=connected, yellow=connecting, red=disconnected/error).

### Requirement: New tab creation
The system SHALL create a new empty terminal tab when user clicks the "+" button or uses keyboard shortcut (Ctrl+T / Cmd+T).

### Requirement: Tab close
The system SHALL close the current tab and disconnect its SSH session when user clicks the "x" button on the tab or uses keyboard shortcut (Ctrl+W / Cmd+W).

### Requirement: Close other tabs
The system SHALL close all tabs except the currently active tab when user right-clicks tab and selects "Close Other Tabs".

### Requirement: Close all tabs
The system SHALL close all open tabs and disconnect all SSH sessions when user selects "Close All Tabs" from tab bar context menu.

### Requirement: Tab drag and drop reordering
The system SHALL allow users to drag and drop tabs to reorder them within the tab bar.

### Requirement: Terminal copy/paste
The system SHALL support text selection and copy (Ctrl+C / Cmd+C) and paste (Ctrl+V / Cmd+V) within the terminal, where Ctrl+C sends SIGINT when text is not selected.

### Requirement: Terminal clear
The system SHALL clear terminal scrollback buffer and visible content when user sends clear sequence (Ctrl+L) or types "clear" command.

### Requirement: Terminal auto-fit
The system SHALL automatically resize terminal content to fill the available window space and re-fit when window is resized.

#### Scenario: Open multiple tabs from bookmarks
- **WHEN** user left-clicks bookmark "Server A" then left-clicks bookmark "Server B"
- **THEN** two tabs appear with titles "Server A" and "Server B"
- **AND** each tab has an active SSH session

#### Scenario: Rename tab
- **WHEN** user double-clicks tab title area and types "My Server"
- **THEN** tab title changes to "My Server"

#### Scenario: Default title uses host:port
- **WHEN** user initiates a quick connection to "192.168.1.100:22" without specifying a session name
- **THEN** tab title defaults to "192.168.1.100:22"

#### Scenario: Status indicator reflects connection state
- **WHEN** SSH connection is in "connecting" state
- **THEN** tab shows yellow dot indicator
- **AND** when connection becomes "connected", indicator changes to green
- **AND** when connection fails, indicator changes to red

#### Scenario: Close current tab
- **WHEN** user clicks "x" on tab "Server A" or presses Ctrl+W / Cmd+W
- **THEN** tab closes
- **AND** SSH session is disconnected
- **AND** remaining tabs remain open

#### Scenario: Drag and drop tab reordering
- **WHEN** user drags tab "Server B" and drops it between "Server A" and "Server C"
- **THEN** tab order becomes "Server A", "Server B", "Server C"

#### Scenario: Copy text from terminal
- **WHEN** user selects text in terminal with mouse and presses Ctrl+C / Cmd+C
- **THEN** selected text is copied to clipboard
- **AND** when no text is selected, Ctrl+C sends SIGINT to remote shell

#### Scenario: Paste into terminal
- **WHEN** user presses Ctrl+V / Cmd+V in terminal
- **THEN** clipboard content is sent to the SSH session as keyboard input

#### Scenario: Window resize triggers terminal refit
- **WHEN** user resizes application window
- **THEN** terminal automatically adjusts its dimensions to fill available space
- **AND** remote PTY is notified of new terminal size
