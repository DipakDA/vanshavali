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

document.getElementById('userSelect').addEventListener('change', async function () {
    const selectedUser = this.value;
    if (selectedUser) {
        const response = await fetch(`/user/${selectedUser}`);
        if (response.ok) {
            const user = await response.json();
            const userProfile = document.getElementById('userProfile');
            let relationshipsHTML = {
                parents: '',
                siblings: '',
                children: '',
                spouse: ''
            };

            // Create an array of promises for fetching related user names
            const relationshipPromises = user.relationships.map(async rel => {
                let related_user_name = rel.related_user_name;
                if (!related_user_name) {
                    let relatedUser = await fetch(`/getUserById/${rel.related_user_id}`);
                    relatedUser = await relatedUser.json();
                    related_user_name = relatedUser.name;
                }

                switch (rel.relation_type) {
                    case 'PARENT':
                        relationshipsHTML.parents += `<p><strong>PARENT:</strong> <a href="#" class="related-user" data-id="${rel.related_user_id}">${related_user_name}</a></p>`;
                        break;
                    case 'SIBLING':
                        relationshipsHTML.siblings += `<p><strong>SIBLING:</strong> <a href="#" class="related-user" data-id="${rel.related_user_id}">${related_user_name}</a></p>`;
                        break;
                    case 'CHILD':
                        relationshipsHTML.children += `<p><strong>CHILD:</strong> <a href="#" class="related-user" data-id="${rel.related_user_id}">${related_user_name}</a></p>`;
                        break;
                    case 'SPOUSE':
                        relationshipsHTML.spouse += `<p><strong>SPOUSE:</strong> <a href="#" class="related-user" data-id="${rel.related_user_id}">${related_user_name}</a></p>`;
                        break;
                }
            });

            // Wait for all promises to complete
            await Promise.all(relationshipPromises);

            // Compute and display implicit relationships
            const implicitRelationshipsHTML = await computeImplicitRelationships(user);
            relationshipsHTML.parents += implicitRelationshipsHTML.parents;
            relationshipsHTML.siblings += implicitRelationshipsHTML.siblings;

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
                ${relationshipsHTML.parents}
                ${relationshipsHTML.spouse}
                ${relationshipsHTML.siblings}
                ${relationshipsHTML.children}
            `;

            document.querySelectorAll('.related-user').forEach(link => {
                link.addEventListener('click', async function (event) {
                    event.preventDefault();
                    const relatedUserId = this.dataset.id;
                    const relatedResponse = await fetch(`/getUserById/${relatedUserId}`);
                    if (relatedResponse.ok) {
                        const relatedUser = await relatedResponse.json();
                        document.getElementById('userSelect').value = relatedUser.name;
                        document.getElementById('userSelect').dispatchEvent(new Event('change'));
                    } else {
                        alert('Failed to fetch related user details');
                    }
                });
            });
        } else {
            alert('Failed to fetch user details');
        }
    } else {
        document.getElementById('userProfile').innerHTML = '';
    }
});

async function computeImplicitRelationships(user) {
    let implicitRelationshipsHTML = {
        parents: '',
        siblings: '',
        children: '',
        spouse: ''
    };

    // Fetch all users to find relationships
    const usersResponse = await fetch('/users');
    const users = await usersResponse.json();

    // Find implicit siblings based on common parents
    const siblings = new Set();
    user.relationships.forEach(rel => {
        if (rel.relation_type === 'PARENT') {
            users.forEach(otherUser => {
                if (otherUser._id !== user._id) {
                    otherUser.relationships.forEach(otherRel => {
                        if (otherRel.relation_type === 'PARENT' && otherRel.related_user_id === rel.related_user_id) {
                            siblings.add(otherUser);
                        }
                    });
                }
            });
        }
    });

    // Add siblings to the relationships HTML
    if (siblings.size > 0) {
        siblings.forEach(sibling => {
            implicitRelationshipsHTML.siblings += `<p><strong>SIBLING:</strong> <a href="#" class="related-user" data-id="${sibling._id}">${sibling.name}</a></p>`;
        });
    }

    // Find implicit parents and their spouses
    const parents = new Set();
    const parentPromises = user.relationships
        .filter(rel => rel.relation_type === 'PARENT')
        .map(async rel => {
            let parent = await fetch(`/getUserById/${rel.related_user_id}`);
            parent = await parent.json();

            // Find the spouse of the parent
            const spouseRel = parent.relationships.find(r => r.relation_type === 'SPOUSE');
            if (spouseRel) {
                let spouse = await fetch(`/getUserById/${spouseRel.related_user_id}`);
                spouse = await spouse.json();
                // Check if spouse is already in parents set
                if (!Array.from(parents).some(p => p._id === spouse._id)) {
                    parents.add(spouse);
                }
            }
        });

    // Wait for all parent promises to complete
    await Promise.all(parentPromises);

    // Add parents to the relationships HTML
    parents.forEach(parent => {
        implicitRelationshipsHTML.parents += `<p><strong>PARENT:</strong> <a href="#" class="related-user" data-id="${parent._id}">${parent.name}</a></p>`;
    });

    return implicitRelationshipsHTML;
}

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
            const data = await response.text();
            document.getElementById('hometown').value = data;
        } else {
            document.getElementById('hometown').value = 'Unknown Pincode';
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

// Populate user dropdowns
async function populateUserDropdowns() {
    const response = await fetch('/users');
    const users = await response.json();
    const userSelect = document.getElementById('userSelectForRelations');
    const relatedUserSelect = document.getElementById('relatedUser');

    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user._id; // Use the user ID as the value
        option.textContent = user.name;
        userSelect.appendChild(option);

        const relatedOption = document.createElement('option');
        relatedOption.value = user._id; // Use the user ID as the value
        relatedOption.textContent = user.name;
        relatedUserSelect.appendChild(relatedOption);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    populateUserDropdowns();

    const userSelect = document.getElementById('userSelectForRelations');
    const relationTypeSelect = document.getElementById('relationType');
    const relatedUserSelect = document.getElementById('relatedUser');
    const confirmationLine = document.getElementById('confirmationLine');

    const updateConfirmationLine = () => {
        const user = userSelect.options[userSelect.selectedIndex].text;
        const relationType = relationTypeSelect.options[relationTypeSelect.selectedIndex].text;
        const relatedUser = relatedUserSelect.options[relatedUserSelect.selectedIndex].text;

        if (userSelect.value && relationTypeSelect.value && relatedUserSelect.value) {
            confirmationLine.textContent = `${relatedUser} is the ${relationType} of ${user}`;
            confirmationLine.style.display = 'block';
        } else {
            confirmationLine.style.display = 'none';
        }
    };

    userSelect.addEventListener('change', updateConfirmationLine);
    relationTypeSelect.addEventListener('change', updateConfirmationLine);
    relatedUserSelect.addEventListener('change', updateConfirmationLine);
});

document.getElementById('manageRelationshipsForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const userId = document.getElementById('userSelectForRelations').value;
    const relationType = document.getElementById('relationType').value;
    const relatedUserId = document.getElementById('relatedUser').value;

    if (userId && relationType && relatedUserId) {
        const response = await fetch('/add_relationship', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                relation_type: relationType,
                related_user_id: relatedUserId
            })
        });

        if (response.ok) {
            document.getElementById('relationSuccessAlert').style.display = 'block';
            this.reset(); // Reset form fields
        } else {
            alert('Failed to add relationship');
        }
    } else {
        alert('Please fill in all fields.');
    }
});