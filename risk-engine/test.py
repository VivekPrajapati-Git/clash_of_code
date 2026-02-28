import torch
from model import RiskGAT
from synthetic_data import generate_synthetic_hospital_graph

def test_model_prediction():
    # 1. Initialize the model architecture
    model = RiskGAT()
    
    # 2. Load the trained weights from risk_model.pth2
    try:
        model.load_state_dict(torch.load("risk_model.pth2"))
        print("Successfully loaded 'risk_model.pth2'")
    except FileNotFoundError:
        print("Model file 'risk_model.pth2' not found. Please train the model first.")
        return
        
    # 3. Set to evaluation mode so dropout gets disabled
    model.eval()
    
    # 4. Generate some testing data to run inference on
    print("\nGenerating evaluation data...")
    test_data = generate_synthetic_hospital_graph(
        num_patients=20, 
        num_staff=40, 
        num_equipment=50, 
        num_locations=10
    )
    
    # 5. Run prediction
    with torch.no_grad(): # Don't compute gradients for inference
        out = model(test_data)
        
    predictions = out.squeeze()
    
    # 6. Apply mask to analyze only target equipment nodes
    mask = test_data.equipment_mask
    equip_predictions = predictions[mask]
    equip_targets = test_data.y[mask]
    
    # 7. Convert probability predictions into binary labels (Threshold = 0.5)
    predicted_labels = (equip_predictions > 0.5).float()
    
    # 8. Compute accuracy on test data
    correct = (predicted_labels == equip_targets).sum().item()
    total = equip_targets.size(0)
    accuracy = correct / total if total > 0 else 0.0
    
    # 9. Find the nodes with the highest risk probabilities
    # We need to map the predicted index back to the absolute Node ID
    # Since equipment is stored consecutively starting after staff and patients:
    patients = 20
    staff = 40
    equipment_start_idx = patients + staff
    
    print("\n--- High Risk Equipment Alert ---")
    print("These pieces of equipment have the highest predicted transmission risk:")
    print(f"{'Node ID':<15} | {'Risk Prediction':<16} | {'Actual Risk Target':<18}")
    print("-" * 55)
    
    # Sort equipment by highest predicted probability (descending)
    sorted_probs, sorted_indices = torch.sort(equip_predictions, descending=True)
    
    # We'll display the top 5 riskiest equipment nodes
    top_k = min(5, total)
    for i in range(top_k):
        orig_equip_idx = sorted_indices[i].item() # The index inside the equipment sub-list
        global_node_id = equipment_start_idx + orig_equip_idx # The absolute graph Node ID
        
        prob = sorted_probs[i].item()
        actual_risk = int(equip_targets[orig_equip_idx].item())
        
        # Display logic: Warn if probability > 0.5
        status_flag = "[DANGER]" if prob > 0.5 else "[SAFE]"
        print(f"Equipment #{global_node_id:<4} | {prob:<16.4f} | {actual_risk:<18} {status_flag}")

if __name__ == "__main__":
    test_model_prediction()
