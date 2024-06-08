from flask import Flask, request, render_template, jsonify
from pymongo import MongoClient, ASCENDING
import indiapins
import os
from bson.objectid import ObjectId
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('familyTreeApp')

class RelationshipType:
    SPOUSE = "SPOUSE"
    PARENT = "PARENT"
    CHILD = "CHILD"

# Replace these with your MongoDB connection details
MONGO_URI = "mongodb://localhost:27017/familyTreeDB"
client = MongoClient(MONGO_URI)
db = client.familyTreeDB
collection = db.family
relationship_collection = db.relationships

# Ensure indexes are created
relationship_collection.create_index([("user_id", ASCENDING)])
relationship_collection.create_index([("related_user_id", ASCENDING)])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add', methods=['POST'])
def add_family_member():
    data = request.json
    name = data.get('name')
    gender = data.get('gender')
    address = data.get('address')
    pincode = data.get('pincode')
    gotra = data.get('gotra')
    dob = data.get('dob')
    phone = data.get('phone')
    marital_status = data.get('marital_status')
    hometown = data.get('hometown')
    photo_data = data.get('photo')

    # Insert the new family member into the collection
    collection.insert_one({
        'name': name,
        'gender': gender,
        'address': address,
        'pincode': pincode,
        'gotra': gotra,
        'dob': dob,
        'phone': phone,
        'marital_status': marital_status,
        'hometown': hometown,
        'photo': photo_data,
        'relationships': []
    })

    return jsonify({'status': 'success'}), 200

@app.route('/users')
def get_users():
    users = list(collection.find({}, {'_id': 1, 'name': 1}))
    # Convert ObjectId to string for JSON serialization
    for user in users:
        user['_id'] = str(user['_id'])
    return jsonify(users)

def convert_objectid_to_str(data):
    if isinstance(data, list):
        for item in data:
            convert_objectid_to_str(item)
    elif isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, ObjectId):
                data[key] = str(value)
            elif isinstance(value, (dict, list)):
                convert_objectid_to_str(value)

@app.route('/user/<name>')
def get_user_details(name):
    user = collection.find_one({'name': name}, {'_id': 0})
    if user:
        convert_objectid_to_str(user)  # Convert ObjectId to string
        return jsonify(user)
    else:
        return jsonify({'error': 'User not found'}), 404
    
@app.route('/get_user/<user_id>', methods=['GET'])
def get_user(user_id):
    user = collection.find_one({"_id": ObjectId(user_id)})
    if user:
        user['_id'] = str(user['_id'])  # Convert ObjectId to string
        return jsonify(user), 200
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/pincode/<pincode>')
def get_hometown(pincode):
    pin_data = indiapins.matching(pincode)
    if pin_data:
        city = pin_data[0]['Name']
        district = pin_data[0]['District']
        hometown = f"{city}, {district}"
    else:
        hometown = "Unknown Location"
    return jsonify({'city': hometown})

@app.route('/add_relationship', methods=['POST'])
def add_relationship():
    data = request.json
    user_id = data.get('user_id')
    relation_type = data.get('relation_type')
    related_user_id = data.get('related_user_id')

    try:
        logger.info(f"Received request to add relationship: {data}")

        user = collection.find_one({"_id": ObjectId(user_id)})
        related_user = collection.find_one({"_id": ObjectId(related_user_id)})

        logger.info(f"User: {user}")
        logger.info(f"Related User: {related_user}")

        if not user or not related_user:
            logger.error(f"User or related user not found. User ID: {user_id}, Related User ID: {related_user_id}")
            return jsonify({'error': 'User not found'}), 404

        update_user_relationship(user_id, relation_type, related_user_id)
        update_user_relationship(related_user_id, get_reverse_relation_type(relation_type), user_id)

        logger.info(f"Successfully added relationship: {relation_type} between User ID: {user_id} and Related User ID: {related_user_id}")
        return jsonify({'status': 'success'}), 200

    except Exception as e:
        logger.exception("Error while adding relationship")
        return jsonify({'error': str(e)}), 500

def update_user_relationship(user_id, relation_type, related_user_id):
    relationship = {"relation_type": relation_type, "related_user_id": ObjectId(related_user_id)}
    collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"relationships": relationship}}
    )

def get_reverse_relation_type(relation_type):
    if relation_type == RelationshipType.PARENT:
        return RelationshipType.CHILD
    elif relation_type == RelationshipType.CHILD:
        return RelationshipType.PARENT
    return relation_type  # SPOUSE remains SPOUSE

if __name__ == '__main__':
    if not os.path.exists('templates'):
        os.makedirs('templates')
    app.run(host='0.0.0.0', port=5001, debug=True)
