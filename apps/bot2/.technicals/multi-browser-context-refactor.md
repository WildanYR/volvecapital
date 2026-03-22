# Multi Browser Context in Module Refactor

## Overview

### Current State

saat ini di base module hanya punya 1 browser context per module instance.

### Expected

module bisa punya multiple browser context.

## Multiple Browser Context

### Overview

browser context akan disimpan menjadi Map dengan key berupa string yang merepresentasikan nama contextnya.

### Browser Context Save State

setiap browser context di module ini memiliki storage state nya masing masing, dengan kombinasi nama file dari nama context dan nama module instance.

## Restriction

jangan pernah melakukan perubahan pada semua file didalam folder src/modules.