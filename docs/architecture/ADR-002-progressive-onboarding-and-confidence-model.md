# ADR 002: Progressive Onboarding & Evidence-Based Confidence Model

- **Status**: Approved
- **Date**: 2026-08-02
- **Deciders**: Product Owner, Manoj Axelsson, Antigravity AI Team

## Context & Problem Statement
Brand-new users are overwhelmed when presented with a massive "day 1 information dump" or speculative predictions that lack underlying data.

## Decision Drivers
- Fast time-to-value (< 5 minutes to productivity).
- Evidence-based predictions rather than arbitrary or speculative estimates.
- Clear non-punitive activation terminology.

## Decision Outcome
Chosen option: **Streamlined Progressive Onboarding & Evidence-Based Confidence Model**.

### 1. Mathematical Confidence Formula
Predictive confidence is calculated strictly from logged candidate activity:

$$\text{Confidence} = \min\left(100, \left(\frac{N_{\text{apps}}}{10} \times 40\right) + \left(\frac{N_{\text{interviews}}}{3} \times 30\right) + \left(\frac{N_{\text{evaluations}}}{20} \times 30\right)\right)$$

### 2. Progressive Activation Terminology (No "Locked" Labels)
- `0% - 30%`: **`🌱 Learning`** (*Accumulating data*)
- `31% - 70%`: **`⚡ Ready`** (*Sufficient statistical data*)
- `71% - 100%`: **`🎯 High Confidence`** (*Verified interview outcome data*)

### Positive Consequences
- Users understand that AI recommendations improve over time as real interaction data is logged.
- Eliminates user frustration caused by "locked" feature UI banners.
