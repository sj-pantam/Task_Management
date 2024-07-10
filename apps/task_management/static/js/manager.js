document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    // Create a new Vue instance
    new Vue({
        el: '#app',
        data: {
            manager: null,
            img_url: "", // URL for manager's profile picture
        },
        mounted() {
            console.log('Vue instance mounted');
            this.getManagerInfo();
        },
        methods: {
            getBaseURL() {
                return window.location.origin + '/' + window.location.pathname.split('/')[1];
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
                        this.manager = data.manager_data;
                        this.getManagerProfilePicture(this.manager.username);
                    } else {
                        console.log(data.message);
                    }
                })
                .catch(error => console.error('Error fetching manager info:', error));
            },
            getManagerProfilePicture(username) {
                const url = this.getBaseURL() + `/api/getProfilePicture/${username}`;
                console.log(`Fetching profile picture for ${username} from ${url}`);
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
            }
        }
    });

    console.log('manager.js code executed');
});
