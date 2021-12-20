# Ariesate Render Engine

A render engine for creating front end frameworks.
You can build your own React/Vue/Angular on top of it.

## Why

## Start To Write Your Own Framework

## Architecture

### View

- Manipulate dom node
- Invoke dom event listener

### Painter

- Invoke pass-in render method to render component
- Calculate vnode difference

### Scheduler

- Schedule the work of Painter and View

- debounce view digest
- User Fiber or other schedule diagram.

### Controller

- Assemble everything
- State management
- 3rd party module system

- State/Listener/Lifecycle as modules
