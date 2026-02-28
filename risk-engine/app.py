from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import torch
from torch_geometric.data import Data

# Import your model definition
from model import RiskGAT

app = FastAPI(title="Hospital Risk Engine API")

# Global variables to store the model
model = None

# --- Application Startup ---
@app.on_event("startup")
async def startup_event():
    global model
    model = RiskGAT()
    try:
        # Load the best model weights
        model.load_state_dict(torch.load("risk_model.pth2"))
        model.eval()
        print("Model 'risk_model.pth2' loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load model upon startup. Error: {e}")


# --- Pydantic Models for Input Validation ---
class Edge(BaseModel):
    source: int
    target: int
    time_delta: float

class NodeFeature(BaseModel):
    node_id: int
    features: List[float] # Expected to be [is_patient, is_staff, is_equipment, is_location]
    node_type: int # 0=Patient, 1=Staff, 2=Equipment, 3=Location

class GraphDataPayload(BaseModel):
    nodes: List[NodeFeature]
    edges: List[Edge]


# --- Route 1: Process Patient Graph and Predict Risk ---
@app.post("/ai/predict/risk/{patient_id}")
async def process_patient_graph(patient_id: str, payload: GraphDataPayload, top_k: int = 5):
    """
    Receives specific patient graph data from Neo4j backend, constructs PyTorch Geometric Data,
    runs the RiskGAT model, and returns the highest risk equipment.
    """
    global model
    
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
    
    try:
        # 1. Parse Nodes
        num_nodes = len(payload.nodes)
        x = torch.zeros((num_nodes, 4), dtype=torch.float)
        node_types = []
        
        # Sort nodes by ID just to be safe it aligns with the tensor index
        sorted_nodes = sorted(payload.nodes, key=lambda n: n.node_id)
        
        equipment_indices = []
        for idx, node in enumerate(sorted_nodes):
            x[idx] = torch.tensor(node.features, dtype=torch.float)
            node_types.append(node.node_type)
            
            if node.node_type == 2: # Equipment
                equipment_indices.append(idx)
                
        # 2. Parse Edges
        edge_index_list = []
        edge_attr_list = []
        
        for edge in payload.edges:
            edge_index_list.append([edge.source, edge.target])
            edge_attr_list.append(edge.time_delta)
            
        edge_index = torch.tensor(edge_index_list, dtype=torch.long).t().contiguous()
        edge_attr = torch.tensor(edge_attr_list, dtype=torch.float).unsqueeze(1)
        
        # 3. Create the PyTorch Geometric Data object
        data = Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
        
        # 4. Create an equipment mask so we know which nodes to predict on
        mask = torch.zeros(num_nodes, dtype=torch.bool)
        if equipment_indices:
            mask[equipment_indices] = True
        data.equipment_mask = mask
        
        # 5. Run Inference
        with torch.no_grad():
            out = model(data)
            
        predictions = out.squeeze()
        
        # 6. Extract only equipment predictions using the mask
        equip_predictions = predictions[mask]
        
        # Gather all global node IDs that correspond to equipment
        equipment_node_ids = torch.nonzero(mask).squeeze().tolist()
        
        # Handle case where there is only 1 or 0 equipment nodes
        if isinstance(equipment_node_ids, int):
            equipment_node_ids = [equipment_node_ids]
            equip_predictions = equip_predictions.unsqueeze(0)
            
        if not equipment_node_ids:
             return {
                 "status": "success", 
                 "patient_id": patient_id,
                 "message": "No equipment nodes found in the graph to predict risk on.", 
                 "high_risk_equipment": []
             }

        # 7. Sort by highest risk
        sorted_probs, sorted_indices = torch.sort(equip_predictions, descending=True)
        
        # 8. Format Output
        results = []
        limit = min(top_k, len(equipment_node_ids))
        
        for i in range(limit):
             # Original index within the filtered equipment list
             orig_idx = sorted_indices[i].item()
             
             # Map back to the global Node ID in the graph
             global_node_id = equipment_node_ids[orig_idx]
             
             prob = sorted_probs[i].item()
             
             results.append({
                 "node_id": global_node_id,
                 "risk_probability": round(prob, 4),
                 "status": "DANGER" if prob > 0.5 else "SAFE"
             })
             
        return {
            "status": "success",
            "patient_id": patient_id,
            "total_equipment_evaluated": len(equipment_node_ids),
            "high_risk_equipment": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process graph and predict risk: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
