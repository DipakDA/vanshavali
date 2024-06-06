function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; tabcontent.length > i; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; tablinks.length > i; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

}

// Open the first tab by default
document.addEventListener("DOMContentLoaded", function() {
    document.getElementsByClassName("tablinks")[0].click();
    fetchUsers();
    enableSubmitButton();
});

// Fetch users and populate the list
async function fetchUsers() {
    const response = await fetch('/users');
    const users = await response.json();
    const userSelect = document.getElementById('userSelect');

    userSelect.innerHTML = '<option value="">Select a user</option>';

    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.name;
        option.textContent = user.name;
        userSelect.appendChild(option);
    });
}

// Fetch user details and populate the profile
document.getElementById('userSelect').addEventListener('change', async function () {
    const selectedUser = this.value;
    if (selectedUser) {
        const response = await fetch(`/user/${selectedUser}`);
        if (response.ok) {
            const user = await response.json();
            const userProfile = document.getElementById('userProfile');
            userProfile.innerHTML = `
                <h3>${user.name}</h3>
                <img src="data:image/png;base64,${user.photo}" alt="User Photo" width="100" height="100">
                <p><strong>Gender:</strong> ${user.gender}</p>
                <p><strong>Address:</strong> ${user.address}</p>
                <p><strong>Pincode:</strong> ${user.pincode}</p>
                <p><strong>Hometown:</strong> ${user.hometown}</p>
                <p><strong>Gotra:</strong> ${user.gotra}</p>
                <p><strong>Date of Birth:</strong> ${user.dob}</p>
                <p><strong>Phone:</strong> ${user.phone}</p>
                <p><strong>Marital Status:</strong> ${user.marital_status}</p>
            `;
        } else {
            alert('Failed to fetch user details');
        }
    } else {
        document.getElementById('userProfile').innerHTML = '';
    }
});

// Handle form submission
document.getElementById('createUserForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent form from submitting the default way

    const formData = new FormData(this);
    const data = {};

    formData.forEach((value, key) => {
        if (key === 'photo') {
            data[key] = value;
        } else {
            data[key] = value;
        }
    });

    // Resize image before sending if a photo is provided
    if (formData.get('photo').name) {
        const photoFile = formData.get('photo');
        const resizedPhoto = await resizeImage(photoFile, 100, 100);
        data.photo = resizedPhoto;
    } else {
        data.photo = '';
    }

    const response = await fetch('/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        document.getElementById('successAlert').style.display = 'block';
        this.reset(); // Reset form fields
        fetchUsers(); // Refresh user list
        disableSubmitButton(); // Disable submit button again
    } else {
        alert('Failed to add family member');
    }
});

// Fetch city based on pincode
document.getElementById('pincode').addEventListener('input', async function () {
    const pincode = this.value;
    if (pincode.length === 6) {
        const response = await fetch(`/pincode/${pincode}`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('hometown').value = data.city;
        }
    }
});

// Resize image function
async function resizeImage(file, width, height) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png').split(',')[1]);
            };
            img.src = event.target.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// Enable submit button if all required fields are filled
function enableSubmitButton() {
    const form = document.getElementById('createUserForm');
    const submitButton = form.querySelector('input[type="submit"]');
    const requiredFields = form.querySelectorAll('input[required], select[required]');

    requiredFields.forEach(field => {
        field.addEventListener('input', () => {
            const allFilled = Array.from(requiredFields).every(input => input.value.trim() !== '');
            submitButton.disabled = !allFilled;
            submitButton.classList.toggle('disabled', !allFilled);
        });
    });

    form.addEventListener('submit', (event) => {
        if (submitButton.disabled) {
            event.preventDefault();
            alert('Please fill in all required fields.');
        }
    });
}

// Disable submit button by default
function disableSubmitButton() {
    const form = document.getElementById('createUserForm');
    const submitButton = form.querySelector('input[type="submit"]');
    submitButton.disabled = true;
    submitButton.classList.add('disabled');
}
