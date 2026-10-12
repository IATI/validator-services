# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Changes before 2.9.5 are not recorded here; see the git history.

## [Unreleased]

### Added

- `pub/stats/summary_precalc` now returns, for each publisher, the number of
  documents (`documents`) and the number with at least one critical error
  (`documents_with_critical`) or error (`documents_with_error`), in both JSON
  and CSV. This lets the Dashboard show the percentage of a publisher's files
  with critical errors or errors
  ([#546](https://github.com/IATI/validator-services/issues/546)). The counts
  use the latest validation report for each document, so they include
  documents that are no longer published.

### Changed

- The OpenAPI spec now gives `summary_precalc` its own response schemas, which
  also document the `advisory` count it already returned.

### Fixed

### Removed
