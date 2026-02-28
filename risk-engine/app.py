from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Any
import torch
from torch_geometric.data import Data
import httpx

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

# --- Route : Process Patient Graph and Predict Risk ---
@app.post("/ai/predict/risk")
async def process_patient_graph(request: Request, top_k: int = 5):
    """
    Receives a patient ID and backend URL, OR a direct Neo4j Graph payload.
    It constructs the PyTorch Geometric Data, runs RiskGAT exactly, and returns the result.
    """
    global model
    
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded.")
        
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body format.")

    # 1. Flexibility: Check if user is passing a fetching URL vs direct graph payload
    # Handles keys like "backend_url", "url", "patient_id", "passientid"
    patient_id = body.get("patient_id") or body.get("passientid") or body.get("id") or "UNKNOWN"
    backend_url = body.get("backend_url") or body.get("url")
    
    # If there's a URL, fetch the graph dynamically from backend!
    if backend_url:
        fetch_url = f"{backend_url.rstrip('/')}/api/neo4j/patient/{patient_id}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(fetch_url)
                response.raise_for_status()
                raw_payload = response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch from backend at {fetch_url}: {str(e)}")
    else:
        # Otherwise, assume the payload itself is the Neo4j graph data directly (e.g. {"message": "...", "data": {"nodes": [], "links": []}})
        raw_payload = body
        if "data" not in raw_payload:
            raise HTTPException(status_code=422, detail="Missing 'data' or 'url' in payload. Please provide backend URL or full Neo4j Graph Data.")

    # Validate Neo4j Data format dynamically
    graph_msg = raw_payload.get("message", "Processing graph")
    graph_data = raw_payload.get("data", {})
    nodes_data = graph_data.get("nodes", [])
    links_data = graph_data.get("links", [])
    
    try:
        num_nodes = len(nodes_data)
        x = torch.zeros((num_nodes, 4), dtype=torch.float)
        
        # 2. Map string Node IDs (e.g. "PFID_X") to integer index IDs (0, 1, 2...) for PyTorch edge_index
        node_id_to_idx = {}
        idx_to_node_id = {}
        equipment_indices = []
        
        # Define Group Mapping array matching our trained model's one-hot encodings:
        group_to_type = { "Patient": 0, "Staff": 1, "Equipment": 2, "Location": 3 }
        
        for idx, node in enumerate(nodes_data):
            node_id = node.get("id", str(idx))
            node_group = node.get("group", "Patient")
            node_id_to_idx[node_id] = idx
            idx_to_node_id[idx] = node_id
            
            node_type = group_to_type.get(node_group, 0)
            
            feature = [0.0, 0.0, 0.0, 0.0]
            if 0 <= node_type <= 3:
                feature[node_type] = 1.0
                
            x[idx] = torch.tensor(feature, dtype=torch.float)
            if node_type == 2:
                equipment_indices.append(idx)
                
        # 3. Parse Links (Edges)
        edge_index_list = []
        edge_attr_list = []
        
        for link in links_data:
            source = link.get("source")
            target = link.get("target")
            if source not in node_id_to_idx or target not in node_id_to_idx:
                continue
                
            src_idx = node_id_to_idx[source]
            dst_idx = node_id_to_idx[target]
            edge_index_list.append([src_idx, dst_idx])
            edge_attr_list.append(1.0)
            
        if not edge_index_list:
            raise ValueError("No valid edges found linking the provided nodes.")
            
        edge_index = torch.tensor(edge_index_list, dtype=torch.long).t().contiguous()
        edge_attr = torch.tensor(edge_attr_list, dtype=torch.float).unsqueeze(1)
        
        # 4. Create PyTorch Geometric Data object
        data = Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
        mask = torch.zeros(num_nodes, dtype=torch.bool)
        if equipment_indices:
            mask[equipment_indices] = True
        data.equipment_mask = mask
        
        # 5. Run Inference
        with torch.no_grad():
            out = model(data)
            
        predictions = out.squeeze()
        equip_predictions = predictions[mask]
        
        if isinstance(equipment_indices, int):
            equipment_indices = [equipment_indices]
            equip_predictions = equip_predictions.unsqueeze(0)
            
        if not equipment_indices:
             return { "status": "success", "message": "No equipment found in graph.", "high_risk_equipment": [] }

        # 6. Sort & Format
        sorted_probs, sorted_indices = torch.sort(equip_predictions, descending=True)
        results = []
        limit = min(top_k, len(equipment_indices))
        for i in range(limit):
             orig_idx = sorted_indices[i].item()
             global_node_id = idx_to_node_id[equipment_indices[orig_idx]]
             prob = sorted_probs[i].item()
             results.append({ "node_id": global_node_id, "risk_probability": round(prob, 4), "status": "DANGER" if prob > 0.5 else "SAFE" })
             
        return {
            "status": "success",
            "message": graph_msg,
            "total_equipment_evaluated": len(equipment_indices),
            "high_risk_equipment": results,
            "graph_data": graph_data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process graph and predict risk: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
