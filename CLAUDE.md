# Project Documentation

## Project Overview
This project follows the WAT (Workflow agents, tools) framework with a layered architecture approach.

## Project Structure

### Workflow Layer
Defines workflow agents and their interactions:
- Workflow agents coordinate complex multi-step operations
- Define state machines and workflow orchestration
- Handle workflow persistence and state management
- Manage workflow execution and error handling

### Tools Layer
Contains specialized tools and utilities:
- Reusable utility functions and helpers
- Data access and manipulation utilities
- External service integrations and API clients
- Domain-specific tool implementations

## Layer Descriptions

### Workflow Agents Layer
Coordinates complex workflows and state management:
- Orchestrate multi-step workflows and state transitions
- Handle workflow persistence and recovery
- Manage workflow execution and error handling
- Coordinate between different workflow agents

### Tools Layer
Contains reusable utilities and utilities:
- Reusable utility functions and helpers
- Data access and manipulation utilities
- External service integrations and API clients
- Domain-specific tool implementations

## Implementation Guidelines

### Workflow Layer
- Define clear workflow states and transitions
- Implement workflow persistence mechanisms
- Handle error conditions and recovery scenarios
- Coordinate between workflow agents effectively

### Tools Layer
- Create reusable, stateless utility functions
- Implement domain-specific utilities
- Provide clean interfaces for external integrations
- Ensure tools are stateless and reusable

## Implementation Guidelines

### Workflow Layer Guidelines
- Define clear workflow states and transitions
- Implement workflow persistence mechanisms
- Handle error conditions and recovery scenarios
- Coordinate between workflow agents effectively

### Tools Layer Guidelines
- Create reusable, stateless utility functions
- Implement domain-specific utilities
- Provide clean interfaces for external integrations
- Ensure tools are stateless and reusable