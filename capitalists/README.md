# README — Capitalists
## Overview

Capitalists is a browser-based strategy and decision game built with HTML, CSS, and JavaScript.

The player takes on the role of a rising associate at a venture capital firm. The goal is to evaluate startups, make investment decisions, and grow a portfolio over time. Progression unlocks more responsibility, more complex deals, and larger capital allocations.

Although the visible objective is maximizing returns, the deeper system rewards recognizing bias, expanding access, and making decisions that improve long-term ecosystem outcomes.

This is a single-player narrative simulation with light management mechanics and branching outcomes.

----

## Core Gameplay

Gameplay happens across two primary interfaces:

Phone Interface

Used for:

Email

Team messages

Founder messages

News alerts

Quick decisions and approvals

This interface drives narrative pacing and introduces new opportunities or risks.

Laptop Interface

Used for:

Pitch decks

Company metrics

Portfolio performance

Market analysis

Investment decisions

This is where most analytical decisions occur.

----

## Player Loop

Receive inbound opportunity or update

Review information (phone or laptop)

Decide:

Invest

Pass

Request more info

Intervene with portfolio company

Outcome simulation runs

Portfolio updates

----

## Player gains score and progression

Progression System

Progression is tied to:

Portfolio growth

Quality of decisions

Reputation

Long-term portfolio health

Hidden awareness metrics

Unlocks include:

Larger deal sizes

Board seats

More complex cap tables

Follow-on rounds

New sectors

----

## Scoring

Visible scoring:

Portfolio value

IRR-style growth indicators

Successful exits

Founder success rate

Hidden scoring:

Diversity of founders funded

Long-term company survival

Ethical decisions

Reduced bias patterns

Hidden scoring influences narrative outcomes and endings.

----

## Tone and Themes

The game mixes:

Realistic startup mechanics

Satirical industry tone

Narrative storytelling

Systems thinking about incentives and bias

It should feel grounded, not cartoonish, even if some writing is humorous.

----

## Current State

Design mockups exist in Figma.

Next step is building a playable prototype in browser.

----

## Technical Approach

This project should remain simple and framework-light.

Preferred stack:

Vanilla JavaScript

HTML

CSS

Optional lightweight chart library later

Avoid:

Heavy frameworks

Complex build systems early on

----

## Suggested File Structure

/capitalists
  index.html
  styles.css
  main.js
  /ui
    phone.js
    laptop.js
  /data
    deals.js
    events.js
  /systems
    scoring.js
    progression.js

----

## Systems To Build First

Priority order:

Screen switching (phone vs laptop)

Message and email rendering

Decision buttons

Portfolio state tracking

Basic scoring

Progression unlocks

Narrative content can be stubbed with placeholder text at first.

----

## Design Principles

Everything should be state-driven

UI should be modular

Decisions should be easy to add via JSON

Game should be playable without sound

Desktop-first, mobile responsive later

----

## Long-Term Ideas (Not Required Now)

Randomized events

Founder personalities

Reputation system

Market cycles

Multiple endings

----

## Definition of First Playable Version

A playable prototype is achieved when:

Player can review at least 3 deals

Player can make investment decisions

Portfolio value changes

A simple progression trigger occurs