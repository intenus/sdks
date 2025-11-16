# Walrus Storage Structure

This document describes the Walrus storage organization for the Intenus Protocol.

## Overview

Walrus is used to store three types of data:

1. **Intents** - User intent submissions (IGSIntent)
2. **Solutions** - Solver solutions (IGSSolution)  
3. **Dataset Data** - Training data, models, and feedback for intent classification

All data is stored as **blobs** identified by `blob_id`. The path structure is logical and used for organization only.

## Structure Folders Architecture

```text
/intents/{id}.json
/solutions/{id}.json
/models/{version}/
  ├─ metadata.json
  ├─ weights.pkl
  ├─ training_samples.jsonl
  └─ feedback.jsonl
```

## Reference

For more details on Walrus operations, see:

- [Walrus Documentation](https://docs.wal.app/)
