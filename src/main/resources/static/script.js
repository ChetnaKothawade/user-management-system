const API_URL = "/api/users";

const form = document.getElementById("userForm");
const userTable = document.getElementById("userTable");
const message = document.getElementById("message");

function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
}

function clearForm() {
    form.reset();
    document.getElementById("userId").value = "";
    document.getElementById("formTitle").textContent = "Add New User";
    document.getElementById("saveButton").textContent = "Add User";
    showMessage("", "");
}

document.getElementById("clearButton").addEventListener("click", clearForm);

async function loadUsers() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Could not load users.");
        }

        const users = await response.json();
        userTable.replaceChildren();

        if (users.length === 0) {
            const row = userTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = "No users found. Add your first user above.";
            return;
        }

        users.forEach(user => {
            const row = userTable.insertRow();

            [user.id, user.name, user.email, user.phone].forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });

            const actionsCell = row.insertCell();

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.className = "edit";
            editButton.addEventListener("click", () => editUser(user));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete";
            deleteButton.addEventListener("click", () => deleteUser(user.id));

            actionsCell.append(editButton, deleteButton);
        });
    } catch (error) {
        userTable.replaceChildren();
        const row = userTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = error.message;
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    const id = document.getElementById("userId").value;
    const user = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim()
    };

    if (!user.name || !user.email || !/^[0-9]{10}$/.test(user.phone)) {
        showMessage("Please enter a name, valid email and 10-digit phone number.", "error");
        return;
    }

    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
        });

        if (response.status === 409) {
            showMessage(await response.text(), "error");
            return;
        }

        if (response.status === 400) {
            showMessage("Please check the entered details. Name, email or phone is invalid.", "error");
            return;
        }

        if (!response.ok) {
            throw new Error(response.status === 404 ? "User not found." : "Unable to save user.");
        }

        clearForm();
        showMessage(id ? "User updated successfully." : "User added successfully.", "success");
        await loadUsers();
    } catch (error) {
        showMessage(error.message + " Check that Spring Boot is running.", "error");
    }
});

function editUser(user) {
    document.getElementById("userId").value = user.id;
    document.getElementById("name").value = user.name;
    document.getElementById("email").value = user.email;
    document.getElementById("phone").value = user.phone;
    document.getElementById("formTitle").textContent = "Update User";
    document.getElementById("saveButton").textContent = "Update User";
    showMessage("", "");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteUser(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

        if (!response.ok) {
            throw new Error(response.status === 404 ? "User not found." : "Unable to delete user.");
        }

        showMessage("User deleted successfully.", "success");
        await loadUsers();
    } catch (error) {
        showMessage(error.message, "error");
    }
}

loadUsers();
