document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    // Create a new Vue component
    Vue.component('profile', {
        props: ['username', 'loggedInUsername', 'uploadUrl'],
        data() {
            return {
                profile: {
                    first_name: '',
                    last_name: '',
                    email: '',
                    username: ''
                },
                manager: {
                    username: '',
                    first_name: '',
                    last_name: '',
                    email: ''
                },
                noManager: false,
                newManager: {
                    email: ''
                },
                errorMessage: '',
                uploading: false,
                uploaded_file: "",
                upload_done: false,
                img_url: "", // Add this line to store the image URL
            };
        },
        mounted() {
            console.log('Vue component mounted');
            this.getProfile();
            this.getProfilePicture();
        },
        methods: {
            getBaseURL() {
                return window.location.origin + '/' + window.location.pathname.split('/')[1];
            },
            getProfile() {
                console.log(`Fetching profile data for ${this.username} from /task_management/api/profile/${this.username}`);
                fetch(`/task_management/api/profile/${this.username}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    console.log('Received response:', response);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Received profile data:', data);
                    this.profile = data;
                    this.profile.username = this.username;
                    this.noManager = !data.manager_first_name && !data.manager_last_name && !data.manager_email;
                    if (!this.noManager) {
                        this.manager.username = data.manager_username;
                        this.manager.first_name = data.manager_first_name;
                        this.manager.last_name = data.manager_last_name;
                        this.manager.email = data.manager_email;
                    }
                })
                .catch(error => console.error('Error fetching profile:', error));
            },
            getProfilePicture() {
                console.log(`Fetching profile picture for ${this.username} from /task_management/api/getProfilePicture/${this.username}`);
                fetch(`/task_management/api/getProfilePicture/${this.username}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(response => {
                    console.log('Received response:', response);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Received profile picture data:', data); // Debug statement
                    if (data.status === "success") {
                        this.img_url = data.thumbnail; // Update img_url with the thumbnail data
                        console.log('Image URL:', this.img_url); // Debug statement
                    } else {
                        console.log('No profile picture available');
                    }
                })
                .catch(error => console.error('Error fetching profile picture:', error));
            },
            uploadFile(event) {
                let input = event.target;
                let file = input.files[0];
                if (file) {
                    let reader = new FileReader();
                    reader.addEventListener("load", () => {
                        console.log("File content (base64):", reader.result);
                        // Sends the image to the server.
                        fetch(this.uploadUrl, {
                            method: "POST",
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ thumbnail: reader.result })
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log('Thumbnail uploaded successfully:', data);
                            this.img_url = reader.result; // Set the local preview
                        })
                        .catch(error => console.error('Error uploading thumbnail:', error));
                    });
                    reader.readAsDataURL(file);
                }
            },
            saveManager() {
                console.log('Saving new manager data');
                fetch('/task_management/api/assignManagers', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: this.newManager.email
                    })
                }).then(response => {
                    console.log('Received response:', response);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Manager updated successfully:', data);
                    if (data.status === 'error') {
                        this.errorMessage = data.message;
                    } else {
                        this.getProfile();
                    }
                })
                .catch(error => console.error('Error updating manager:', error));
            },
            clearManager() {
                console.log('Clearing manager data');
                fetch('/task_management/api/assignManagers', {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json'
                    }
                }).then(response => {
                    console.log('Received response:', response);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Manager cleared successfully:', data);
                    this.getProfile();
                })
                .catch(error => console.error('Error clearing manager:', error));
            }
        },
        template: `
            <div class="container">
                <div class="profile-info">
                    <h2>Profile</h2>
                    <div class="profile-section">
                        <div class="thumbnail">
                            <img :src="img_url" alt="Profile Picture" v-if="img_url">
                            <div class="thumbnail-placeholder" v-else></div>
                            <input type="file" @change="uploadFile" v-if="username === loggedInUsername">
                        </div>
                        <p><strong>Username:</strong> {{ profile.username }}</p>
                        <p><strong>Name:</strong> {{ profile.first_name }} {{ profile.last_name }}</p>
                        <p><strong>Email:</strong> {{ profile.email }}</p>
                    </div>
                    <div class="divider"></div>
                    <h2>Manager Information</h2>
                    <div class="profile-section" v-if="noManager">
                        <p><strong>No manager assigned</strong></p>
                    </div>
                    <div class="profile-section" v-else>
                        <p><strong>Username:</strong> <a :href="getBaseURL() + '/' + manager.username.toLowerCase() + '/profile'">{{ manager.username }}</a></p>
                        <p><strong>Name:</strong> {{ manager.first_name }} {{ manager.last_name }}</p>
                        <p><strong>Email:</strong> <a :href="'mailto:' + manager.email">{{ manager.email }}</a></p>
                    </div>
                    <div class="divider"></div>
                    <div class="spacer"></div>
                    <div v-if="username === loggedInUsername" class="update-manager">
                        <h2>Change Manager</h2>
                        <form @submit.prevent="saveManager">
                            <div>
                                <label for="managerEmail">Enter Manager's Email:</label>
                                <input type="email" id="managerEmail" v-model="newManager.email" required>
                            </div>
                            <div class="button-group">
                                <button type="submit">Update Manager</button>
                                <button type="button" @click="clearManager">Clear Manager</button>
                            </div>
                        </form>
                        <p class="error-message" v-if="errorMessage">{{ errorMessage }}</p>
                    </div>
                </div>
            </div>
        `
    });

    // Initialize Vue
    new Vue({
        el: '#app',
        data: {
            username: window.username,
            loggedInUsername: window.loggedInUsername,
            uploadUrl: window.uploadUrl
        }
    });

    console.log('profile.js code executed');
});
