import json
import matplotlib.pyplot as plt
import networkx as nx
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('localhost', 27017)
db = client.familyTreeDB
collection = db.family

# Fetch data from MongoDB
family_data = list(collection.find())

# # Initialize a directed graph
# family_tree = nx.DiGraph()

# # Add nodes and edges based on relationships
# for person in family_data:
#     family_tree.add_node(person['_id'], **person)
#     for relation in person['relationships']:
#         if relation['relation_type'] == 'SPOUSE':
#             family_tree.add_edge(person['_id'], relation['related_user_id'], relation='spouse')
#         elif relation['relation_type'] == 'CHILDREN':
#             for child_id in relation['related_user_id']:
#                 family_tree.add_edge(person['_id'], child_id, relation='parent')

# # Custom layout for better visualization
# pos = {
#     "0": (0, 1),   # Position for Surender Agrawal
#     "2": (2, 1),   # Position for Mamta Devi Agrawal
#     "1": (1, 0),   # Position for Dipak Agrawal
#     "3": (1, 2)    # Position for Yatish Agrawal
# }

# # Function to draw family tree
# def draw_family_tree(graph, pos):
#     labels = {node: data['name'] for node, data in graph.nodes(data=True)}
#     edge_labels = {(u, v): d['relation'] for u, v, d in graph.edges(data=True)}
    
#     plt.figure(figsize=(12, 8))
#     nx.draw(graph, pos, with_labels=True, labels=labels, node_size=3000, node_color='skyblue', font_size=10, font_color='black', font_weight='bold')
#     nx.draw_networkx_edge_labels(graph, pos, edge_labels=edge_labels, font_color='red')
#     plt.title('Family Tree')
#     plt.show()

# # Draw the family tree
# draw_family_tree(family_tree, pos)

from pyvis.network import Network

# Initialize a pyvis network
net = Network(height="750px", width="100%", directed=True)

# Add nodes
for person in family_data:
    title = f"Name: {person['name']}<br>Address: {person['address']}<br>Phone: {person['phone']}<br>DOB: {person['dob']}<br>Marital Status: {person['marital_status']}"
    net.add_node(person['_id'], label=person['name'], title=title, size=30)

# Add edges
for person in family_data:
    for relation in person['relationships']:
        if relation['relation_type'] == 'SPOUSE':
            net.add_edge(person['_id'], relation['related_user_id'], label='spouse')
        elif relation['relation_type'] == 'CHILDREN':
            for child_id in relation['related_user_id']:
                net.add_edge(person['_id'], child_id, label='parent')

# Save the network to an HTML file
net.save_graph("family_tree.html")