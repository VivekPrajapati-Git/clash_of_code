import torch
import torch.nn.functional as F
from torch_geometric.nn import GATConv
from synthetic_data import generate_synthetic_hospital_graph
import matplotlib.pyplot as plt

class RiskGAT(torch.nn.Module):
    def __init__(self, dropout_rate=0.4):
        super().__init__()
        self.gat1 = GATConv(4, 16, heads=4)
        self.gat2 = GATConv(16*4, 8, heads=2)
        self.lin = torch.nn.Linear(8*2, 1)
        self.dropout_rate = dropout_rate

    def forward(self, data):
        x, edge_index = data.x, data.edge_index

        x = F.dropout(x, p=self.dropout_rate, training=self.training)
        x = self.gat1(x, edge_index)
        x = F.elu(x)

        x = F.dropout(x, p=self.dropout_rate, training=self.training)
        x = self.gat2(x, edge_index)
        x = F.elu(x)

        x = F.dropout(x, p=self.dropout_rate, training=self.training)
        x = self.lin(x)
        return torch.sigmoid(x)

model = RiskGAT(dropout_rate=0.4)
# Added weight decay for regularization
optimizer = torch.optim.Adam(model.parameters(), lr=0.005, weight_decay=5e-4)

# Generate data once to keep the same graph and splits across epochs
data = generate_synthetic_hospital_graph(num_patients=50, num_staff=100, num_equipment=150, num_locations=20)

epochs = 300
train_losses = []
val_losses = []
train_accuracies = []
val_accuracies = []

for epoch in range(epochs):
    # Training Phase
    model.train()
    optimizer.zero_grad()
    
    out = model(data)
    
    # Calculate training metrics
    train_mask = data.train_mask
    train_pred = out.squeeze()[train_mask]
    train_targets = data.y[train_mask]
    
    train_loss = F.binary_cross_entropy(train_pred, train_targets)
    train_loss.backward()
    optimizer.step()
    
    train_predicted_labels = (train_pred > 0.5).float()
    train_correct = (train_predicted_labels == train_targets).sum().item()
    train_accuracy = train_correct / train_targets.size(0) if train_targets.size(0) > 0 else 0.0

    # Validation Phase
    model.eval()
    with torch.no_grad():
        out = model(data)
        
        val_mask = data.val_mask
        val_pred = out.squeeze()[val_mask]
        val_targets = data.y[val_mask]
        
        val_loss = F.binary_cross_entropy(val_pred, val_targets)
        val_predicted_labels = (val_pred > 0.5).float()
        val_correct = (val_predicted_labels == val_targets).sum().item()
        val_accuracy = val_correct / val_targets.size(0) if val_targets.size(0) > 0 else 0.0

    train_losses.append(train_loss.item())
    val_losses.append(val_loss.item())
    train_accuracies.append(train_accuracy)
    val_accuracies.append(val_accuracy)

    if epoch % 20 == 0:
        print(f"Epoch: {epoch:03d}, Train Loss: {train_loss.item():.4f}, Train Acc: {train_accuracy:.4f}, Val Loss: {val_loss.item():.4f}, Val Acc: {val_accuracy:.4f}")

torch.save(model.state_dict(), "risk_model.pth2")

# Plotting graphs
plt.figure(figsize=(14, 5))

# Loss Graph
plt.subplot(1, 2, 1)
plt.plot(range(epochs), train_losses, label='Training Loss', color='red')
plt.plot(range(epochs), val_losses, label='Validation Loss', color='orange', linestyle='dashed')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.title('Loss over Epochs (Train vs Val)')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)

# Accuracy Graph
plt.subplot(1, 2, 2)
plt.plot(range(epochs), train_accuracies, label='Training Accuracy', color='blue')
plt.plot(range(epochs), val_accuracies, label='Validation Accuracy', color='cyan', linestyle='dashed')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.title('Accuracy over Epochs (Train vs Val)')
plt.legend()
plt.grid(True, linestyle='--', alpha=0.7)

plt.tight_layout()
plt.savefig('training_graphs.png')
print("Training graphs saved as 'training_graphs.png'")