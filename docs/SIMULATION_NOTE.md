# Simulation note

Every record in ledger-data/ is generated, not observed. This file states the generator, its
parameters and its date, so that a reader can reproduce the dataset or tell at a glance that no
operational supply chain is represented.

Generator: [script name and version]. Parameters: [shipment count, route graph, temperature
excursion rate, failure modes injected]. Generated: [date].

The interface labels simulated records with a SIMULATED badge. If a real pilot is ever connected,
pilot data lives in a separate directory under a separate data management note and is never mixed
with simulation in the same view.
