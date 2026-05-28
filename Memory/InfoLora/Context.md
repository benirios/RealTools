---
title: Context
tags: [infolora, backend, context]
created: 2026-04-11
---

You are an expert backend engineer.

Your task is to design and implement the backend for a school information system called "Infolora".

## PROJECT CONTEXT
Infolora is a system that displays school information (such as classroom temperatures and announcements) on a large screen.

The frontend is being developed by another team. Your responsibility is ONLY the backend and data layer.

## CURRENT STRATEGY
- Start with simulated data
- Later integrate real sensor data using The Things Network (TTN)
- Therefore, the system MUST be designed to easily switch from simulated data to real IoT data without major refactoring

## CORE BACKEND RESPONSIBILITIES
- Provide an API for:
  - Classroom temperatures
  - Announcements
- Handle incoming sensor data (future: via TTN webhooks or MQTT)
- Store and manage data
- Support real-time or near real-time updates

## KEY REQUIREMENTS
- Clean and modular architecture
- Abstraction layer for data sources (simulation vs real sensors)
- Easy integration with TTN (event-based ingestion)
- REST API for frontend consumption
- Simple database (e.g., SQLite or PostgreSQL)
- Scalable structure, but not overengineered

## DATA DESIGN (INITIAL)
Temperature:
- room_id
- value
- timestamp

Announcements:
- id
- title
- message
- priority
- created_at

## IMPORTANT CONSTRAINT
The simulated data MUST follow the same structure as TTN payloads.

## FUTURE INTEGRATION (TTN)
Assume TTN will send JSON payloads via webhook.

Example structure:
{
  "device_id": "room_101_sensor",
  "temperature": 22.5,
  "timestamp": "ISO8601"
}

## TASK
1. Propose backend architecture
2. Define folder structure
3. Suggest tech stack (Node.js, Python, etc.)
4. Implement:
   - API endpoints
   - Data models
   - Simulated data generator
5. Prepare the system for TTN webhook integration (even if mocked)

## OUTPUT STYLE
- Step-by-step
- Clean code
- No unnecessary explanations
- Focus on real implementation