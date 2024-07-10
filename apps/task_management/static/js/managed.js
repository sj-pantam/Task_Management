document.addEventListener("DOMContentLoaded", function() {
    console.log('Loading managedusers.js script');

    new Vue({
        el: '#app',
        data: {
            users: [],
            errorMessage: ''
        },
        mounted() {
            console.log('Vue instance mounted');
            this.getManagedUsers();
        },
        methods: {
            getBaseURL() {
                return window.location.origin + '/' + window.location.pathname.split('/')[1];
            },
            getManagedUsers() {
                const url = this.getBaseURL() + `/api/managed_users`;
                console.log(`Fetching managed users data from ${url}`);
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
                    console.log('Received managed users data:', data);
                    if (data.status === 'error') {
                        this.errorMessage = data.message;
                    } else {
                        this.users = data.users;
                    }
                })
                .catch(error => {
                    console.error('Error fetching managed users:', error);
                    this.errorMessage = 'An error occurred while fetching managed users.';
                });
            }
        }
    });
});
