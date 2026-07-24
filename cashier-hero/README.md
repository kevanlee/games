# README — Cashier Hero
## Overview

Cashier Hero is a browser-based skill and simulation game built with HTML, CSS, and JavaScript.

The player works the front counter of a coffee shop, entering orders into a POS system as accurately and quickly as possible. Over time, more menu items unlock, orders become more complex, and the pace increases.

Later in the game, the player unlocks the barista station and prepares drinks directly.

This game combines:

Reaction time

Pattern recognition

Interface navigation

Light time pressure

----

## Core Gameplay

The player interacts with:

NPC customers giving spoken or text orders at the register

A POS interface with categories and items

A running order ticket

A score, tips, and timer

Player Loop

Customer arrives

Order is presented

Player enters order into POS

Player asks for the pickup name

Player takes payment

Order is validated

Score awarded based on:

Accuracy

Speed

Tip chance

Next customer arrives

Progression

Unlock system:

New drink types

Pastries

Modifiers (milk types, sizes, extras)

Faster customer arrival

Larger orders

Later stage:

Switch to drink-making gameplay

POS Interface Structure

Top-level categories:

Drinks

Pastries

Merch

Each category reveals submenu items.

Orders should be built item-by-item and shown in a ticket area.

----

## Scoring System

Points based on:

Correct items

Correct modifiers

Time to completion

Order streaks

Penalties:

Wrong items

Missing modifiers

Slow entry

Difficulty Scaling

Variables to control difficulty:

Order length

Customer speed

Menu size

Modifier complexity

----

## Technical Approach

Preferred stack:

Vanilla JS

HTML

CSS

No frameworks needed.

Game should run entirely in browser.

----

## Suggested File Structure

/cashier-hero
  index.html
  styles.css
  main.js
  /pos
    menu.js
    orderBuilder.js
    validation.js
  /npc
    orders.js
    dialogue.js
  /systems
    scoring.js
    levels.js

----

## Systems To Build First

Priority order:

Static POS layout

Clickable menu categories

Order builder

NPC order display

Order validation

Score tracking

Later Systems

Timer

Sound effects

Combo bonuses

Barista station

----

## Cooler / More Immersive Directions

Strong candidates for the next stage of the game:

### Customer personality + messy ordering

Give each customer a light personality archetype so each car feels different.

Examples:

Rushed commuter

Polite regular

Indecisive customer

Grumpy customer

Teen friend-group energy

This personality can affect:

How they phrase their order

How quickly they respond

How patient they are while waiting

Whether they change their mind mid-order

Whether they speak clearly, casually, or messily

Goal:

Make customers feel like real people instead of clean generated prompts.

### Clarification / memory gameplay

The player should sometimes need to:

Ask for the order again

Confirm whether that is everything

Repeat back a specific item

Risk entering the order from memory under pressure

This would make the headset flow feel more immersive and less like copying text from a static prompt.

### Reactive drive-thru queue

The line should feel alive and respond to player performance.

Possible behaviors:

Cars get impatient if they wait too long

Customers react differently based on personality

Some cars leave the line if service is too slow

Fast service can earn small mood or patience bonuses

This makes queue management feel more like a living system instead of a passive timer.

### Presentation / atmosphere polish

Add small sensory details that improve the feel of the world:

Headset beep / static

Car arrival sounds

Receipt printer sounds

Card swipe / approval sounds

Different car silhouettes or colors

Time-of-day variation across days

Weather or shift mood changes

More expressive recap text

These should improve feel and feedback without changing the core rules.

### Barista station expansion

Once the cashier loop feels expressive and alive, expand into drink-making gameplay.

Possible later additions:

Drink assembly station

Milk steaming timing

Shot pulling

Cup labeling

Multi-station shift flow between register and bar

This should come after the cashier fantasy is strong enough to support a larger role simulation.

### Recommended next priority

Best next feature:

Customer personality + messy order variation

Why:

The current prototype already has a strong mechanical loop:

Front-counter line pressure

POS entry

Payment handling

Scoring and recap

Day progression

The biggest immersion upgrade now is making customers feel less like clean generated prompts and more like real people ordering at a coffee-shop counter.

This would improve:

Replayability

Immersion

Tension

Roleplay feel

It also fits the existing chat / headset structure already in the prototype.

----

## Definition of First Playable Version

A playable prototype is achieved when:

NPC gives order

Player can input order

System validates result

Score changes

Next order appears

----

## Design Principles

Input should feel fast

UI should be clear and readable

Everything should be modular

Menu items should be data-driven
