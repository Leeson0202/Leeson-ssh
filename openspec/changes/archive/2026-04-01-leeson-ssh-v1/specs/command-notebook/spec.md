## ADDED Requirements

### Requirement: Open local TXT file as command notebook
The system SHALL allow users to open any local .txt file via file dialog and display its content in the command notebook panel.

### Requirement: Real-time editing
The system SHALL allow users to edit the opened TXT file directly in the notebook panel with changes persisted immediately.

### Requirement: Auto-save
The system SHALL automatically save file changes when user moves focus away from the notebook panel or presses Ctrl+S / Cmd+S.

### Requirement: Current line highlighting
The system SHALL visually highlight the line where the text cursor is positioned.

### Requirement: Send current line to active terminal
The system SHALL send the content of the current line (where cursor is positioned) to the currently active SSH terminal session when user presses Ctrl+I (Windows) or Cmd+I (macOS).

### Requirement: Send line processing
Before sending, the system SHALL trim leading and trailing whitespace from the line content and append a newline character before transmission.

### Requirement: Panel collapse and expand
The system SHALL allow the command notebook panel to be collapsed to a narrow strip and expanded via toggle button.

### Requirement: Floating mode
The system SHALL support detaching the command notebook into a separate floating window.

#### Scenario: Open TXT file as notebook
- **WHEN** user clicks "Open File" button in notebook panel and selects "/Users/me/commands.txt"
- **THEN** file content is displayed in the notebook panel
- **AND** user can edit the content

#### Scenario: Auto-save on focus change
- **WHEN** user edits lines in the notebook and then clicks on the terminal panel
- **THEN** changes are saved to the file automatically

#### Scenario: Current line highlighted
- **WHEN** cursor is on line 5 of the notebook
- **THEN** line 5 has a distinct background highlight

#### Scenario: Send current line with Ctrl+I / Cmd+I
- **WHEN** cursor is on line containing "ls -la /home/user"
- **AND** user presses Ctrl+I (Windows) or Cmd+I (macOS)
- **THEN** the string "ls -la /home/user\n" is sent to the active SSH terminal
- **AND** the cursor moves to the next line

#### Scenario: Leading/trailing whitespace trimmed before send
- **WHEN** current line is "  cd /var/log  "
- **AND** user sends via Ctrl+I / Cmd+I
- **THEN** the string "cd /var/log\n" is sent (whitespace removed)

#### Scenario: Collapse notebook panel
- **WHEN** user clicks the collapse button on the notebook panel header
- **THEN** panel collapses to a narrow strip showing only the header
- **AND** clicking expand button restores the panel

#### Scenario: Float notebook as separate window
- **WHEN** user clicks the float/detach button on notebook panel
- **THEN** a new window opens containing the notebook editor
- **AND** changes in the floating window sync with main window
