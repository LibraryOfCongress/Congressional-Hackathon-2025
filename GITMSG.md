# GitMsg Core Protocol Specification

GitMsg is a decentralized messaging protocol using Git commits as message containers and Git repositories as distributed stores.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 1. Messages

Messages are immutable Git commits with GitMsg headers.

### 1.1. Basic Structure

```
[<subject-line>]

[<message-body>]

--- GitMsg: Ext="<extension>"; [extension:field-name="value"]; V="<version>"; ExtV="<version>" ---

[--- GitMsg-Ref: Ext="<extension>"; [extension:field-name="value"]; Ref="<reference>"; V="<version>"; ExtV="<ext-version>" ---]
[Reference metadata content]
```

### 1.2. Header Requirements

Headers MUST contain Ext, V (protocol version), and ExtV (extension version) fields. Extension-specific fields are OPTIONAL. Headers MUST start with `--- GitMsg: ` and end with ` ---`, using semicolon-separated `field="value"` pairs.

Extensions MUST define how message types are specified, typically using an `<extension>:type` field (e.g., `social:type="comment"`).

### 1.3. Reference Sections

Reference sections MUST start with `--- GitMsg-Ref:` and include Ext, Ref, V, and ExtV fields. Referenced content MUST be prefixed with "> " on each line.

**Reference Formats:**

- Remote repositories: `<repository-url>#<reference-type>:<reference-value>`
  - HTTPS: `https://github.com/user/repo#commit:abc123456789`
  - SSH: `git@github.com:user/repo.git#commit:abc123456789`
- My repository: `#<reference-type>:<reference-value>`
  - Example: `#commit:abc123456789`

#### 1.3.1. Reference Types

References use `<type>:<value>` format. Extensions MAY define additional reference types beyond the common ones:

**Common types:** `commit:` (12-char hash), `branch:` (branch name), `tag:` (tag name), `pr:` (PR number), `issue:` (issue number)

**Commit hashes**: MUST be EXACTLY 12 characters (e.g., `abc123456789`)

#### 1.3.2. Cross-Extension References

When referencing messages from different extensions, include `SourceExt` and `SourceExtV` fields:

```
--- GitMsg-Ref: Ext="social"; SourceExt="pm"; SourceExtV="0.2.0"; Ref="https://github.com/user/repo#commit:abc123456789"; V="0.1.0"; ExtV="0.1.0" ---
```

### 1.4. Implicit Messages

Extensions MAY support implicit messages - commits without GitMsg headers on configured branches. Extensions supporting implicit messages MUST define which branches contain implicit messages and their types.

## 2. Mutable Data Storage

GitMsg uses state-based storage for mutable data. State is stored as JSON documents in git commits.

### 2.1. State-Based Storage

State-based storage maintains the current state as a single JSON document. Each update replaces the entire state with a new commit.

**Characteristics:**

- O(1) read performance (no reconstruction needed)
- Current state stored as JSON in commit content
- Git history preserves all previous states
- Each update creates new commit with complete state

**Storage convention:**

- Store JSON documents as commit content
- Reference points to latest commit containing state
- Each update creates new commit with complete state

### 2.2. Lists

Lists are mutable collections stored using state-based approach.

**Requirements:**

- Names MUST match `[a-zA-Z0-9_-]{1,40}`
- Storage location: `refs/gitmsg/<extension>/lists/<name>`
- Content: JSON document with current state

**Example:**

```json
{
  "version": "0.1.0",
  "id": "reading",
  "name": "Reading",
  "repositories": ["https://github.com/user/repo#branch:main", "git@github.com:owner/repo#branch:main"]
}
```

## 3. Extensions

Extensions define message types and operations. All messages MUST declare the extension:

```
--- GitMsg: Ext="<extension>"; V="<version>"; ExtV="<version>" ---
```

### 3.1. Extension Requirements

- MUST store data under `refs/gitmsg/<extension-name>/`
- MUST validate extension compatibility before processing
- SHOULD handle unknown extensions gracefully
- Configuration stored at `refs/gitmsg/<extension-name>/config` as JSON

### 3.2. Extension Manifest

```json
{
  "name": "social",
  "version": "0.1.0",
  "namespace": "social",
  "description": "Social networking extension for GitMsg",
  "depends": [],
  "types": {
    "messages": ["post", "comment", "repost", "quote"]
  },
  "fields": {
    "social:original": "reference",
    "social:reply-to": "reference"
  },
  "storage": {
    "lists": "state-based"
  }
}
```

## Appendix: Examples

### Minimal Message

```
Hello world!

--- GitMsg: Ext="social"; social:type="post"; V="0.1.0"; ExtV="0.1.0" ---
```

### Message with Reference

```
This is a response

--- GitMsg: Ext="social"; social:type="comment"; social:original="https://github.com/user/repo#commit:abc123456789"; V="0.1.0"; ExtV="0.1.0" ---

--- GitMsg-Ref: Ext="social"; social:author-name="Alice Smith"; social:author-email="alice@example.com"; social:author-time="2025-01-06T10:30:00Z"; Ref="https://github.com/user/repo#commit:abc123456789"; V="0.1.0"; ExtV="0.1.0" ---
> Original message content
```

## Appendix: Validation

### Key Patterns

- **Header**: `^--- GitMsg: (.*) ---$`
- **Required Fields**: `Ext="[a-z][a-z0-9_-]*"`, `V="\d+\.\d+\.\d+"`, `ExtV="\d+\.\d+\.\d+"`
- **Reference (HTTPS)**: `^https?://[^#]+#[a-z]+:[a-zA-Z0-9_/-]+$`
- **Reference (SSH)**: `^git@[^:]+:[^#]+#[a-z]+:[a-zA-Z0-9_/-]+$`
- **Reference (Own)**: `^#[a-z]+:[a-zA-Z0-9_/-]+$`
- **Commit Reference**: `^(https?://[^#]+|git@[^:]+:[^#]+|)#commit:[a-f0-9]{12}$`
- **List Names**: `^[a-zA-Z0-9_-]{1,40}$`
- **Namespace**: `^refs/gitmsg/[a-z][a-z0-9_-]*/.*$`