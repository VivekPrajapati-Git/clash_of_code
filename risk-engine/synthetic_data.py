import random
import torch
from torch_geometric.data import Data
import numpy as np

def generate_synthetic_hospital_graph(
    num_patients=10,
    num_staff=20,
    num_equipment=30,
    num_locations=5
):
    nodes = []
    node_types = []

    # Node type encoding
    # 0 = patient
    # 1 = staff
    # 2 = equipment
    # 3 = location

    for _ in range(num_patients):
        nodes.append(len(nodes))
        node_types.append(0)

    for _ in range(num_staff):
        nodes.append(len(nodes))
        node_types.append(1)

    for _ in range(num_equipment):
        nodes.append(len(nodes))
        node_types.append(2)

    for _ in range(num_locations):
        nodes.append(len(nodes))
        node_types.append(3)

    edge_index = []
    edge_time_delta = []

    # Simulate patient → staff exposure
    for p in range(num_patients):
        exposed_staff = random.sample(
            range(num_patients, num_patients+num_staff),
            random.randint(1, 3)
        )
        for s in exposed_staff:
            edge_index.append([p, s])
            edge_time_delta.append(random.random())

    # staff → equipment usage
    equipment_start = num_patients + num_staff
    equipment_end = equipment_start + num_equipment
    
    for s in range(num_patients, num_patients+num_staff):
        used_equipment = random.sample(
            range(equipment_start, equipment_end),
            random.randint(1, 4)
        )
        for e in used_equipment:
            edge_index.append([s, e])
            edge_time_delta.append(random.random())

    # equipment → location
    location_start = equipment_end
    location_end = location_start + num_locations
    for e in range(equipment_start, equipment_end):
        loc = random.choice(range(location_start, location_end))
        edge_index.append([e, loc])
        edge_time_delta.append(random.random())

    # Make edges bidirectional so GAT can pass messages in both directions
    edge_index_rev = [[dst, src] for src, dst in edge_index]
    edge_time_delta_rev = list(edge_time_delta)
    
    edge_index.extend(edge_index_rev)
    edge_time_delta.extend(edge_time_delta_rev)

    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
    edge_attr = torch.tensor(edge_time_delta, dtype=torch.float).unsqueeze(1)

    # Node features (One-hot encoding of node types)
    x = torch.zeros(len(nodes), 4)
    for i, t in enumerate(node_types):
        x[i, t] = 1

    # Synthetic realistic risk label for equipment
    # Equipment is high risk (1) if used by 2 or more staff members, otherwise 0
    y = torch.zeros(len(nodes))
    equipment_exposure = {e: 0 for e in range(equipment_start, equipment_end)}
    
    # We count staff -> equipment edges (where staff type=1 and equip type=2)
    for src, dst in zip(edge_index[0].tolist(), edge_index[1].tolist()):
        if node_types[src] == 1 and node_types[dst] == 2:
            equipment_exposure[dst] += 1
            
    for i, t in enumerate(node_types):
        if t == 2:  # equipment
            y[i] = 1.0 if equipment_exposure.get(i, 0) >= 2 else 0.0

    # Create a mask so the model computes metrics only on target (equipment) nodes
    mask = torch.zeros(len(nodes), dtype=torch.bool)
    mask[equipment_start:equipment_end] = True

    # Create train and val masks (80/20 split on equipment)
    equipment_indices = list(range(equipment_start, equipment_end))
    random.shuffle(equipment_indices)
    train_count = int(num_equipment * 0.8)
    
    train_mask = torch.zeros(len(nodes), dtype=torch.bool)
    train_mask[equipment_indices[:train_count]] = True
    
    val_mask = torch.zeros(len(nodes), dtype=torch.bool)
    val_mask[equipment_indices[train_count:]] = True

    data = Data(x=x, edge_index=edge_index, edge_attr=edge_attr, y=y)
    data.equipment_mask = mask
    data.train_mask = train_mask
    data.val_mask = val_mask
    return data