---
title: Taking apart a 113-year-old equation
date: 2026-11-05
description: Three years testing where the shortcut chemists use to predict reaction speeds breaks.
draft: true
---

The steady-state hypothesis has simplified reaction math for 113 years. At Instituto Principia I spent three years testing where it breaks.

## What I found

- It can be off by **up to 37%**, while its "total" version stays within **14%**.
- A model can fit the data almost perfectly (R² > 0.99) and still get how fast a reaction goes **10x wrong**.
- I also tested it on **1,938 enzyme measurements from 735 papers**, and it held in about **92%** of them.

## Two test cases

I built Python models of two global problems: ozone depletion (CFCs) and food security (Haber-Bosch ammonia reactors).

> TODO (Gabriel): write this part in your own words before publishing.

The full thesis is [here](/research/chemical-kinetics/paper.pdf).
