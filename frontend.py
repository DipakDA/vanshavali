from flask import Flask, request, render_template, jsonify
from pymongo import MongoClient
from PIL import Image
import io
import base64
import indiapins
import os

app = Flask(__name__)

# Replace these with your MongoDB connection details
MONGO_URI = "mongodb://localhost:27017/familyTreeDB"
client = MongoClient(MONGO_URI)
db = client.familyTreeDB
collection = db.family

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
    users = list(collection.find({}, {'_id': 0, 'name': 1}))
    return jsonify(users)

@app.route('/user/<name>')
def get_user_details(name):
    user = collection.find_one({'name': name}, {'_id': 0})
    if user:
        return jsonify(user)
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

if __name__ == '__main__':
    if not os.path.exists('templates'):
        os.makedirs('templates')
    app.run(host='0.0.0.0', port=5001, debug=True)
