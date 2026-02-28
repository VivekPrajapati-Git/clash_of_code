# feature_extractor/extractor.py
# ---------------------------------------------------------------
# Core graph traversal logic.
#
# Input  : patient_id + GraphData (nodes + links from Neo4j JSON)
# Output : ExtractedFeatures
#
# No SQL. No DB calls. Pure in-memory graph traversal.
# ---------------------------------------------------------------

from __future__ import annotations

from datetime import datetime, timedelta

from config import (
    GROUP_PATIENT, GROUP_STAFF, GROUP_LOCATION, GROUP_EQUIPMENT,
    HIGH_RISK_LOCATIONS, HIGH_RISK_INTERACTIONS,
    TIMESTAMP_FORMATS, RECENT_WINDOW_HOURS, ML_FEATURE_CAPS,
)
from schemas import GraphData, ExtractedFeatures


# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------

def _parse_ts(s: str | None) -> datetime | None:
    """Try each known timestamp format. Return None on failure."""
    if not s:
        return None
    for fmt in TIMESTAMP_FORMATS:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def _cap(value: int | float, key: str) -> int | float:
    """Clamp a feature to its ML training bound."""
    limit = ML_FEATURE_CAPS.get(key)
    return min(value, limit) if limit is not None else value


# ---------------------------------------------------------------
# Main extractor
# ---------------------------------------------------------------

def extract_features(
    patient_id: str,
    graph: GraphData,
    reference_time: datetime,
) -> ExtractedFeatures:
    """
    Traverses the Neo4j graph JSON and computes all features
    for the specified patient.

    Algorithm:
        1.  Build fast-lookup dicts from nodes and links.
        2.  Identify all patients and flagged (auto-triggered) patients.
        3.  Collect this patient's direct staff contacts, locations, interaction types.
        4.  Derive timestamps → exposure_time, interactions_24h.
        5.  Compute shortest_path by checking location/staff overlap with flagged patients.
        6.  Count infected_neighbors (flagged patients sharing staff or location).
        7.  Compute centrality as fraction of other patients reachable.
        8.  Collect supporting features (equipment, indirect exposure, etc.).
        9.  Clamp ML features to training bounds before returning.
    """

    # --- 1. Build lookup structures ---
    node_map = {n.id: n for n in graph.nodes}
    links    = graph.links

    def group(node_id: str) -> str:
        return node_map.get(node_id, type("", (), {"group": ""})()).group  # type: ignore

    # --- 2. Patient sets ---
    all_patients   = {n.id for n in graph.nodes if n.group == GROUP_PATIENT}
    flagged        = {n.id for n in graph.nodes if n.group == GROUP_PATIENT and n.flagged}
    flagged_others = flagged - {patient_id}

    # --- 3. Direct connections ---
    outgoing = [l for l in links if l.source == patient_id]
    incoming = [l for l in links if l.target == patient_id]

    staff_contacts    = {l.source for l in incoming if group(l.source) == GROUP_STAFF}
    locations_visited = {l.target for l in outgoing if group(l.target) == GROUP_LOCATION}
    ixn_types         = {l.type   for l in outgoing + incoming}

    # Degree = all unique direct neighbour node IDs
    all_direct_neighbors = (
        {l.target for l in outgoing} | {l.source for l in incoming}
    )
    degree = len(all_direct_neighbors)

    # --- 4. Timestamps ---
    all_patient_links = outgoing + incoming
    timestamps = [
        t for l in all_patient_links
        if (t := _parse_ts(l.time)) is not None
    ]

    exposure_time = 0
    if len(timestamps) >= 2:
        exposure_time = int(
            (max(timestamps) - min(timestamps)).total_seconds() / 60
        )

    cutoff           = reference_time - timedelta(hours=RECENT_WINDOW_HOURS)
    interactions_24h = sum(1 for t in timestamps if t >= cutoff)

    # --- 5. Shortest path to nearest flagged patient ---
    #   1 = this patient's location is also a location of a flagged patient
    #   2 = a staff member has touched both this patient and a flagged patient
    #   3 = no graph path found within 2 hops
    flagged_locations = (
        {l.target for l in links if l.source in flagged_others and group(l.target) == GROUP_LOCATION}
        | {l.source for l in links if l.target in flagged_others and group(l.source) == GROUP_LOCATION}
    )
    flagged_staff = {
        l.source for l in links
        if l.target in flagged_others and group(l.source) == GROUP_STAFF
    }

    if locations_visited & flagged_locations:
        shortest_path = 1
    elif staff_contacts & flagged_staff:
        shortest_path = 2
    else:
        shortest_path = 3

    # --- 6. Infected neighbors ---
    #   Flagged patients who share at least one staff member or location
    inf_via_staff = {
        l.target for l in links
        if l.source in staff_contacts
        and l.target in flagged_others
        and group(l.target) == GROUP_PATIENT
    }
    inf_via_loc = {
        l.source for l in links
        if l.target in locations_visited
        and l.source in flagged_others
        and group(l.source) == GROUP_PATIENT
    }
    infected_neighbors = len(inf_via_staff | inf_via_loc)

    # --- 7. Centrality ---
    #   Fraction of all OTHER patients reachable via this patient's staff or locations
    n_other = len(all_patients) - 1
    if n_other <= 0:
        centrality = 0.0
    else:
        reachable: set[str] = set()
        for l in links:
            # Staff-mediated reach
            if l.source in staff_contacts and group(l.target) == GROUP_PATIENT and l.target != patient_id:
                reachable.add(l.target)
            if l.target in staff_contacts and group(l.source) == GROUP_PATIENT and l.source != patient_id:
                reachable.add(l.source)
            # Location-mediated reach
            if l.target in locations_visited and group(l.source) == GROUP_PATIENT and l.source != patient_id:
                reachable.add(l.source)
            if l.source in locations_visited and group(l.target) == GROUP_PATIENT and l.target != patient_id:
                reachable.add(l.target)
        centrality = round(len(reachable) / n_other, 4)

    # --- 8. Supporting features ---
    indirect_exposure_staff = len({
        s for s in staff_contacts
        if any(
            group(l.target) == GROUP_PATIENT and l.target != patient_id
            for l in links if l.source == s
        )
    })

    shared_equipment_count = len({
        l.source for l in links
        if l.type == "LOCATED_AT"
        and l.target in locations_visited
        and group(l.source) == GROUP_EQUIPMENT
    })

    # --- 9. Return with ML caps applied ---
    return ExtractedFeatures(
        # ML model features
        degree=             int(_cap(degree,             "degree")),
        infected_neighbors= int(_cap(infected_neighbors, "infected_neighbors")),
        exposure_time=      int(_cap(exposure_time,      "exposure_time")),
        shortest_path=      shortest_path,
        centrality=         float(_cap(centrality,       "centrality")),
        # Rule scorer + dashboard extras
        n_staff_contacts=        len(staff_contacts),
        n_locations_visited=     len(locations_visited),
        n_interaction_types=     len(ixn_types),
        high_risk_location=      int(bool(locations_visited & HIGH_RISK_LOCATIONS)),
        high_risk_interaction=   int(bool(ixn_types & HIGH_RISK_INTERACTIONS)),
        interactions_24h=        interactions_24h,
        indirect_exposure_staff= indirect_exposure_staff,
        auto_trigger_flag=       int(patient_id in flagged),
        shared_equipment_count=  shared_equipment_count,
    )


def get_graph_context(
    patient_id: str,
    graph: GraphData,
) -> dict:
    """
    Returns a human-readable summary of this patient's graph
    neighbourhood for dashboard display and audit logging.
    """
    node_map = {n.id: n for n in graph.nodes}
    links    = graph.links

    def group(node_id: str) -> str:
        return node_map.get(node_id, type("", (), {"group": ""})()).group  # type: ignore

    outgoing = [l for l in links if l.source == patient_id]
    incoming = [l for l in links if l.target == patient_id]

    staff_contacts    = sorted({l.source for l in incoming if group(l.source) == GROUP_STAFF})
    locations_visited = sorted({l.target for l in outgoing if group(l.target) == GROUP_LOCATION})
    ixn_types         = sorted({l.type for l in outgoing + incoming})
    flagged_others    = sorted({n.id for n in graph.nodes if n.group == GROUP_PATIENT and n.flagged and n.id != patient_id})
    all_flagged       = sorted({n.id for n in graph.nodes if n.group == GROUP_PATIENT and n.flagged})

    flagged_nearby = sorted({
        l.target for l in links
        if l.source in set(staff_contacts)
        and node_map.get(l.target, type("",(),{"group":"","flagged":False})()).group == GROUP_PATIENT  # type: ignore
        and node_map.get(l.target, type("",(),{"group":"","flagged":False})()).flagged  # type: ignore
        and l.target != patient_id
    } | {
        l.source for l in links
        if l.target in set(locations_visited)
        and node_map.get(l.source, type("",(),{"group":"","flagged":False})()).group == GROUP_PATIENT  # type: ignore
        and node_map.get(l.source, type("",(),{"group":"","flagged":False})()).flagged  # type: ignore
        and l.source != patient_id
    })

    return {
        "staff_contacts":           staff_contacts,
        "locations_visited":        locations_visited,
        "interaction_types":        ixn_types,
        "flagged_patients_nearby":  flagged_nearby,
        "all_flagged_in_graph":     all_flagged,
        "total_graph_nodes":        len(graph.nodes),
        "total_graph_links":        len(graph.links),
    }