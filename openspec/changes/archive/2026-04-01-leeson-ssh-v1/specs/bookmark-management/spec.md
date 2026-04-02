## ADDED Requirements

### Requirement: Bookmark creation
The system SHALL allow users to save SSH connection information as a bookmark with fields: name, host, port, username, auth type (password/private_key), credential reference, and notes.

### Requirement: Bookmark grouping
The system SHALL support organizing bookmarks into user-defined groups (folders), with support for nested groups up to 2 levels deep.

### Requirement: Bookmark search
The system SHALL support fuzzy search on bookmark name and host IP/domain, filtering the displayed list in real-time as user types.

### Requirement: Bookmark quick connect
The system SHALL create a new terminal tab and initiate SSH connection when user left-clicks on a bookmark.

### Requirement: Bookmark context menu
The system SHALL display a context menu on right-click with options: Edit, Delete, Duplicate, Move to Group.

### Requirement: Bookmark editing
The system SHALL allow editing all bookmark fields and save changes to local persistent storage.

### Requirement: Bookmark deletion
The system SHALL remove a bookmark from storage and close any associated active terminal tabs when user confirms deletion.

### Requirement: Bookmark move to group
The system SHALL relocate a bookmark to a different group when user selects "Move to Group" and specifies destination.

### Requirement: Bookmark persistence
The system SHALL persist all bookmarks and groups to local JSON storage, surviving application restarts.

#### Scenario: Create bookmark with password auth
- **WHEN** user fills bookmark form with name "Production Web", host "prod.example.com", port 22, username "webadmin", auth type "password", and clicks Save
- **THEN** bookmark appears under default group in sidebar
- **AND** credential is stored securely in local config

#### Scenario: Create bookmark with private key
- **WHEN** user fills bookmark form with name "DB Server", host "10.0.0.5", username "dbuser", auth type "private_key", selects key file "/Users/me/.ssh/id_rsa", and clicks Save
- **THEN** bookmark appears in designated group in sidebar

#### Scenario: Search bookmarks
- **WHEN** user types "prod" in search box
- **THEN** bookmarks with name or host containing "prod" are displayed
- **AND** non-matching bookmarks are hidden

#### Scenario: Left-click bookmark connects
- **WHEN** user left-clicks on bookmark "Staging Server"
- **THEN** a new terminal tab opens
- **AND** tab title shows "Staging Server - connecting..."
- **AND** SSH connection initiates

#### Scenario: Edit bookmark via context menu
- **WHEN** user right-clicks bookmark and selects "Edit"
- **THEN** bookmark form opens pre-filled with existing values
- **AND** user can modify and save changes

#### Scenario: Delete bookmark
- **WHEN** user right-clicks bookmark and selects "Delete"
- **THEN** confirmation dialog appears
- **AND** upon confirmation, bookmark is removed and any open tab for that connection closes

#### Scenario: Move bookmark to different group
- **WHEN** user right-clicks bookmark, selects "Move to Group", and chooses "Production"
- **THEN** bookmark relocates from current group to "Production" group
