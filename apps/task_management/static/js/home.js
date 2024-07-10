document.addEventListener("DOMContentLoaded", function() {
    console.log('Loading home.js script');

    new Vue({
        el: '#app',
        data: {
            profile: {
                first_name: '',
                last_name: '',
                email: '',
                username: '',
                manager_first_name: '',
                manager_last_name: '',
                manager_email: ''
            },
            manager: {
                username: '',
                first_name: '',
                last_name: '',
                email: ''
            },
            noManager: false,
            loggedInUsername: '',
            tasks: [],
            loading: true,
            img_url: "", // Add this line to store the image URL
        },
        mounted() {
            console.log('Vue instance mounted');
            this.getLoggedInUser();
            this.generateTasks();
        },
        methods: {
            getBaseURL() {
                return window.location.origin + '/' + window.location.pathname.split('/')[1];
            },
            getLoggedInUser() {
                const url = this.getBaseURL() + `/api/homeuser`;
                console.log(`Fetching logged in user data from ${url}`);
                fetch(url, {
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
                    console.log('Received user data (raw):', data);
                    this.loggedInUsername = data.loggedInUsername;
                    this.getProfile();
                    this.getProfilePicture(); // Fetch the profile picture
                })
                .catch(error => console.error('Error fetching user data:', error));
            },
            getProfile() {
                const username = this.loggedInUsername;
                const url = this.getBaseURL() + `/api/profile/${username}`;
                console.log(`Fetching profile data from ${url}`);
                fetch(url, {
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
                    console.log('Received profile data (raw):', data);
                    this.profile.first_name = data.first_name;
                    this.profile.last_name = data.last_name;
                    this.profile.email = data.email;
                    this.profile.username = username;
                    this.profile.manager_first_name = data.manager_first_name;
                    this.profile.manager_last_name = data.manager_last_name;
                    this.profile.manager_email = data.manager_email;
                    this.noManager = !data.manager_first_name && !data.manager_last_name && !data.manager_email;
                    if (!this.noManager) {
                        this.getManagerInfo();
                    }
                    this.loading = false;
                })
                .catch(error => {
                    console.error('Error fetching profile:', error);
                    this.loading = false;
                });
            },
            getProfilePicture() {
                const url = this.getBaseURL() + `/api/getProfilePicture/${this.loggedInUsername}`;
                console.log(`Fetching profile picture from ${url}`);
                fetch(url, {
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
                    console.log('Received profile picture data:', data);
                    if (data.status === "success") {
                        this.img_url = data.thumbnail;
                        console.log('Profile picture URL:', this.img_url);
                    } else {
                        console.log('No profile picture available');
                    }
                })
                .catch(error => console.error('Error fetching profile picture:', error));
            },
            getManagerInfo() {
                const url = this.getBaseURL() + `/api/manager_info`;
                console.log(`Fetching manager info from ${url}`);
                fetch(url, {
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
                    console.log('Received manager info:', data);
                    if (data.status === 'success') {
                        this.manager.username = data.manager_data.username;
                        this.manager.first_name = data.manager_data.first_name;
                        this.manager.last_name = data.manager_data.last_name;
                        this.manager.email = data.manager_data.email;
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => console.error('Error fetching manager info:', error));
            },
            generateTasks() {
                console.log('Generating tasks');
                for (let i = 1; i <= 50; i++) {
                    this.tasks.push({ id: i, text: `Task ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.` });
                }
                console.log('Generated tasks:', this.tasks);
            },
            goToProfile() {
                document.getElementById('content-frame').src = this.getBaseURL() + '/auth/profile';
            },
            goToChangePassword() {
                document.getElementById('content-frame').src = this.getBaseURL() + '/auth/change_password';
            },
            goToLogout() {
                window.location.href = this.getBaseURL() + '/auth/logout';
            },
            goToManageProfile() {
                document.getElementById('content-frame').src = this.getBaseURL() + '/' + this.loggedInUsername + '/profile';
            },
            goToDirectory() {
                document.getElementById('content-frame').src = 'directory.html';
            },
            goToCreateTask() {
                document.getElementById('content-frame').src = 'create_task.html';
            },
            goToTasks() {
                document.getElementById('content-frame').src = 'tasks.html';
            },
            goToManagedUsers() {
                document.getElementById('content-frame').src = 'managed.html';
            },
            goToViewManager() {
                document.getElementById('content-frame').src = 'manager.html';
            },
        }
    });
});
